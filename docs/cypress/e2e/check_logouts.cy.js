xdescribe('Check logout works from every page', () => {
    let pages = [
        'facilitator_groups.html',
        'facilitator_profile.html',
        'group.html',
        'manage-session-plans.html',
        'home.html',
        // 'create_group.html', doesnt have menu
        // 'create_semester.html' doesnt have a menu
    ]

    pages.forEach((item, index, arr) => {
        it(`should log out properly from ${item}`, () => {
            cy.loginByGoogle('user', {cachedSession: false});
            cy.visit('http://localhost:3030/'+item);
            cy.contains('a', 'Logout')
            .click();

            cy.origin('https://readable.auth.eu-west-1.amazoncognito.com', () => {
                cy.url().should('contain', 'amazoncognito.com/login');
                cy.contains('button', 'Continue with Google');
            })
            
        });
    })
    
});