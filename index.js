/**
 * This is the entry point for your Probot App.
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')

  // Add Branch Protection
  app.on('installation_repositories.added', (context) => {
    app.log('added protected branch to repo')
    for (repo of context.payload.repositories_added) {
      app.log(repo)
      let full_name = repo.full_name
      context.github.repos.updateBranchProtection({
        owner: full_name.split('/')[0],
        repo: repo.name,
        branch: 'master',
        required_status_checks: null,
        enforce_admins: true,
        required_pull_request_reviews: {
          require_code_owner_reviews: true,
        },
        restrictions: null
      })
    }
  })
}