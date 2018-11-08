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
    app.log(req.body)
    const report = Buffer.from(req.body.report, 'base64').toString()
    const {pull_request, head_branch, head_sha, need_comment} = req.body
    const {login, repo} = req.body.slug.split('/')
  
    const id = await foundInstallationId(app, login)
    if (id === -1) {
      res.sendStatus(404)
      return
    }
  
    const github = await app.auth(id)
  
    if (need_comment) {
      const comment = {
        number: pull_request,
        repo: repo,
        owner: login,
        body: formatMessage(report)
      }
      app.log(comment)
      github.issues.createComment(comment)
    }
  
    context.github.checks.create({
      owner: login,
      repo: repo,
      name: checkName(),
      head_branch: head_branch,
      head_sha: head_sha,
      status: 'completed',
      conclusion: 'success',
      completed_at: new Date(),
      output: {
        title: 'Coverage report',
        summary: formatMessage(report)
      }
    })
    res.send('ok')
  })
}
