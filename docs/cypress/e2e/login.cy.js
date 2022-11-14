describe('Test Login', () => {
  it('should redirect to the correct page after logging in', () => {
    cy.loginByGoogle('user');
  })
})

describe('Validating home.html', () => {
  it('should have a correct logout button on every page', () => {
    cy.loginByGoogle('user');
    cy.visit('/home.html');
    cy.validateMenu();
  })
});

describe('Validating Semester page', () => {
  it('should have a correct logout button on every page', () => {
    cy.loginByGoogle('user');
    cy.visit('/home.html');
    cy.get('div#semestersList button').first().click();
    cy.validateMenu();
  })
});