
Cypress.Commands.add('loginByGoogle', (name, { cachedSession = true } = {}) => {
    const login = () => {
        cy.visit('/')

        cy.origin('https://readable.auth.eu-west-1.amazoncognito.com', () => {
            cy.contains('button', 'Continue with Google')
            .click({force: true}) 
        })
        
        cy.origin('https://accounts.google.com', () => {
            const resizeObserverLoopError = /^[^(ResizeObserver loop limit exceeded)]/;
            Cypress.on('uncaught:exception', (err) => {
                /* returning false here prevents Cypress from failing the test */
                if (resizeObserverLoopError.test(err.message)) {
                return false;
                }
            });
            cy.get('input#identifierId[type="email"]')
            .type(Cypress.env('googleSocialLoginUsername'))
            .get('button[type="button"]').contains('Next')
            .click()
            .get('div#password input[type="password"]')
            .type(Cypress.env('googleSocialLoginPassword'))
            .get('button[type="button"]').contains('Next')
            .click()
            .wait(20000);
        });

        cy.url().should('contain', 'home.html');
    }
    if (cachedSession) {
        cy.session(name, login, 
            {   
                validate() {
                    cy.visit('/home.html');
                    cy.window()
                    .its("sessionStorage")
                    .invoke("getItem", "id_token")
                    .should("exist");
                },
                cacheAcrossSpecs: true
            });
    } else {
        login();
    }
        
});