Cypress.Commands.add('validateMenu', () => {
    cy.contains('a', 'Logout').should('have.attr', 'onclick', 'logout(event)');
})