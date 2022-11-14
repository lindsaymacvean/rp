const { defineConfig } = require('cypress');
require('dotenv').config()

module.exports = defineConfig({
  env: {
    googleSocialLoginUsername: process.env.GOOGLE_USERNAME,
    googleSocialLoginPassword: process.env.GOOGLE_PASSWORD
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
    },
    experimentalSessionAndOrigin: true,
    experimentalModifyObstructiveThirdPartyCode: true
  }
})