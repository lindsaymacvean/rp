// Best to use this library https://stackoverflow.com/questions/53487224/anyone-has-an-example-in-cypress-that-uses-google-login

before(() => {
  cy.loginByGoogle();
});

describe('E2E testing', () => {
  it('should have a correct logout button on every page', () => {
  })
});
