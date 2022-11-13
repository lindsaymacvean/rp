// This is probably all useless https://stackoverflow.com/questions/47372472/trouble-getting-cognito-jwt-token-back-when-using-google-sign-in

import { Amplify, Auth } from 'aws-amplify';
import * as AWS from 'aws-sdk';

// It is easier to set these global variables here rather than try to pass the variables through the chained functions
// This is acceptable as this code is for testing but if it was in the production it might be dangerous
let token;
let expires_in;

Amplify.configure({
    Auth: {

        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        identityPoolId: 'eu-west-1:46cea415-4825-4847-8bb1-1503fe07dcea',

        // REQUIRED - Amazon Cognito Region
        region: 'eu-west-1',

        // OPTIONAL - Amazon Cognito Federated Identity Pool Region 
        // Required only if it's different from Amazon Cognito Region
        // identityPoolRegion: 'XX-XXXX-X',

        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: 'eu-west-1_QSQoQgvuD',

        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: '651p7go9kkj4j3fr78qph3j96t',

        // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
        mandatorySignIn: false,

        // OPTIONAL - Configuration for cookie storage
        // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
        // cookieStorage: {
        // // REQUIRED - Cookie domain (only required if cookieStorage is provided)
        //     domain: '.yourdomain.com',
        // // OPTIONAL - Cookie path
        //     path: '/',
        // // OPTIONAL - Cookie expiration in days
        //     expires: 365,
        // // OPTIONAL - See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
        //     sameSite: "strict" | "lax",
        // // OPTIONAL - Cookie secure flag
        // // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
        //     secure: true
        // },

        // OPTIONAL - customized storage object
        // storage: MyStorage,

        // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
        // authenticationFlowType: 'USER_PASSWORD_AUTH',

        // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
        // clientMetadata: { myCustomKey: 'myCustomValue' },

         // OPTIONAL - Hosted UI configuration
        // oauth: {
        //     domain: 'your_cognito_domain',
        //     scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
        //     redirectSignIn: 'http://localhost:3000/',
        //     redirectSignOut: 'http://localhost:3000/',
        //     responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
        // }
    }
});

AWS.config.update({region:'eu-west-1'});

Cypress.Commands.add('loginByGoogleApi', () => {
    // cy.task('log', 'GetGoogleAuthToken')
    GetGoogleAuthToken()
    .then(({body}) => {
        // cy.task('log', `GetGoogleUserInfo with ${JSON.stringify(body)}`); 
        return GetGoogleUserInfo(body);
    })
    .then( async ({body}) => {
        // BEWARE cy methods can't reside in the same function scope as an 'await' (cypress complains)
        // (Do one or the other but not both at the same time, use a follow on 'then' if necessary)
        cy.task('log', `GetCognitoFederatedLogin with ${JSON.stringify(body)}`);
        
    
        // This needs to be async because otherwise a promise is returned by the aws-amplify Auth method
        // return await GetCognitoFederatedLogin(body);
    })
    .then( async (body) => {
        // cy.task('log', `GetOpenIdToken with ${JSON.stringify(body)}`)
        // return await GetCognitoIdentity(body.identityId, {'accounts.google.com':token})
    })
    .then((body) => {
        // cy.task('log', `GetOpenIdToken with ${body.data}`);
        //await GetOpenIdToken();
        //window.sessionStorage.setItem('id_token', user.token);
    });

    // .then(cred => {
    //     cy.task('log', cred);
    //     return Auth.currentAuthenticatedUser();
    // });

    
    
    
    
})

function GetGoogleAuthToken() {
    return cy.request({
        method: 'POST',
        url: 'https://www.googleapis.com/oauth2/v4/token',
        body: {
            grant_type: 'refresh_token',
            client_id: Cypress.env('googleClientId'),
            client_secret: Cypress.env('googleClientSecret'),
            refresh_token: Cypress.env('googleRefreshToken')
        }
    })
}

function GetGoogleUserInfo(body) {
    token = body.id_token;
    expires_in = body.expires_in;
    return cy.request({
        method: 'GET',
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        headers: { Authorization: `Bearer ${body.access_token}` }
    });
}

async function GetCognitoFederatedLogin(body) {
    return await Auth.federatedSignIn(
        'google',
        {
            token,
            expires_at: expires_in * 1000 + new Date().getTime()
        },
        {
            email: body.email,
            name: body.given_name + ' ' + body.family_name,
            picture: body.picture
        }
    );
}
  
async function GetCognitoIdentity(IdentityId, Logins) {
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'eu-west-1:46cea415-4825-4847-8bb1-1503fe07dcea',
        Logins
    });

    return await AWS.config.credentials.get(function () { 
        let cognitoidentity = new AWS.CognitoIdentity();
        return cognitoidentity.getOpenIdToken({IdentityId, Logins}, (err, data) => {
            if (err) return err
            else return data;
        });
    })
}
  