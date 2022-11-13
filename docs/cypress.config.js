const { defineConfig } = require('cypress');
const { GoogleSocialLogin } = require('cypress-social-login').plugins;

require('dotenv').config()

module.exports = defineConfig({
  env: {
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleClientId: process.env.REACT_APP_GOOGLE_CLIENTID,
    googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log (message) {
          console.log(message)
          return null
        }
      });

      on('task', {
        GoogleSocialLogin: GoogleSocialLogin
      });
    }
  }
})