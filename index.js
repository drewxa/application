/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')

  // Add Branch Protection
  app.on('create', (context) => {
    app.log.info('on create event')
    if (context.payload.ref_type === 'branch') {
      if (context.payload.ref === context.payload.master_branch) {
        app.log('added protected branch to repo')
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
}
