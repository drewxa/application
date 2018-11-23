async function foundInstallationId (app, login) {
  app.log(login)
  const github = await app.auth()
  const installations = await github.apps.getInstallations()
  for (const installation of installations.data) {
    app.log(installation.account)
    if (installation.account.login === login) {
      app.log('found ' + installation.id)
      return installation.id
    }
  }
  return -1
}

function formatMessage (report) {
  return '```\n' + report + '\n```'
}

function checkName () {
  return 'Coverage'
}

async function createCheckRoutine (app, req, res, checkName, checkTitle) {
  app.log(req.body)
  const report = Buffer.from(req.body.report, 'base64').toString()
  const {head_branch, head_sha, slug} = req.body
  const login = slug.split('/')[0]
  const repo = slug.split('/')[1]

  const id = await foundInstallationId(app, login)
  if (id === -1) {
    res.sendStatus(404)
    return
  }

  const github = await app.auth(id)
  if (github) {
    const params = {
      owner: login,
      repo: repo,
      name: checkName,
      head_branch: head_branch,
      head_sha: head_sha,
      status: 'completed',
      conclusion: 'success',
      completed_at: new Date(),
      output: {
        title: checkTitle,
        summary: formatMessage(report)
      }
    }
    app.log(params)
    github.checks.create(params)
    res.send('ok')
    return
  }

  res.send(504)
}

/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  const route = app.route('/')
  var bodyParser = require('body-parser')
  route.use(bodyParser.json())
  route.use(bodyParser.urlencoded({
    extended: false
  }))

  app.log('Yay, the app was loaded!')

  // Add Branch Protection
  app.on('create', (context) => {
    app.log.info('on create event')
    if (context.payload.ref_type === 'branch') {
      if (context.payload.ref === context.payload.master_branch) {
        app.log('added protected branch to repo')
        app.log.info(context.repo())
        context.github.repos.updateBranchProtection(context.repo({
          branch: context.payload.master_branch,
          required_status_checks: null,
          enforce_admins: true,
          required_pull_request_reviews: {
            require_code_owner_reviews: true,
          },
          restrictions: null
        }))
      }
    }
  })

  route.post('/coverage', async (req, res) => {
    app.log.info('on coverage report')
    await createCheckRoutine(app, req, res, checkName(), 'Coverage report')
  })

  route.post('/duplication', async (req, res) => {
    app.log.info('on duplication report')
    await createCheckRoutine(app, req, res, 'Code quality', 'Code quality')
  })
}
