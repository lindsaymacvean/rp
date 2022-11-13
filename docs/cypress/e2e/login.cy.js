// Best to use this library https://stackoverflow.com/questions/53487224/anyone-has-an-example-in-cypress-that-uses-google-login



before(() => {
  cy.clearCookies();
  
  
  // cy.loginByGoogleApi()
  // .then(body => {
  //   //cy.task('log', body);
  // })
  // cy.request(
  //   {
  //     url:'https://readable.auth.eu-west-1.amazoncognito.com/oauth2/authorize?identity_provider=Google&redirect_uri=http://localhost:3030&response_type=TOKEN&client_id=651p7go9kkj4j3fr78qph3j96t&scope=email openid profile',
  //     followRedirect: true
  //   }
  // )
  // .get('#identifierId')
  // .type('rptrial@dyslexia.ie')
  // .click('#identifierNext');
});

describe('Google login', () => {
  

  it('should visit Home Page', () => {
    
  })
});
