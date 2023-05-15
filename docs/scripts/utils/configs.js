export const template_file_id = "14n_3hhDxZczEKvRIuHxWf0jA2Ie4zQ_jSMLX3nIEync";
export const first_second_file_id = "1me_8rHbOXRVjV7vsOnhxGdjtyS37-Yccw4EUD2DDdGM";

let a, b, c, d, e;

const environment = 'Production';

switch(environment) {
    case 'Andriy':
        // Andriy Complete backend
        a = "https://aromakh.auth.eu-west-2.amazoncognito.com/login?client_id=443ahpd9l151fmj7b8h4df5qi5&response_type=token&scope=email+openid+profile&redirect_uri=https://localhost";
        b = "https://aromakh.auth.eu-west-2.amazoncognito.com/login?client_id=443ahpd9l151fmj7b8h4df5qi5&response_type=token&redirect_uri=https://localhost";
        c = "https://opawbz65p2.execute-api.eu-west-2.amazonaws.com/ReadableApiStage";
        d = "558820778077-59ngbdg8dcht3cta26tmpblt05tqo3o5.apps.googleusercontent.com";
        e = "https://localhost";
        break;
    case 'Testing':
        // Cypress testing settings
        a = "https://readable.auth.eu-west-1.amazoncognito.com/login?client_id=651p7go9kkj4j3fr78qph3j96t&response_type=token&scope=email+openid+profile&redirect_uri=http://localhost:3030";
        b = "https://readable.auth.eu-west-1.amazoncognito.com/login?client_id=651p7go9kkj4j3fr78qph3j96t&response_type=token&redirect_uri=http://localhost:3030";
        c = "https://qihx5f0xfa.execute-api.eu-west-1.amazonaws.com/Stage";
        d = "925322795697-i9jr2o8gkqan3cdqvkn7tjog5la33av6.apps.googleusercontent.com";
        e = "http://localhost:3030";
        break;
    case 'Lindsay':
        // Lindsay local using production backend
        a = "https://readable.auth.eu-west-1.amazoncognito.com/login?client_id=651p7go9kkj4j3fr78qph3j96t&response_type=token&scope=email+openid+profile&redirect_uri=http://localhost:8080";
        b = "https://readable.auth.eu-west-1.amazoncognito.com/login?client_id=651p7go9kkj4j3fr78qph3j96t&response_type=token&redirect_uri=http://localhost:8080";
        c = "https://qihx5f0xfa.execute-api.eu-west-1.amazonaws.com/Stage";
        d = "925322795697-i9jr2o8gkqan3cdqvkn7tjog5la33av6.apps.googleusercontent.com";
        e = "http://localhost:8080";
        break;
    case 'Production':
        // Production
        a = "https://readable.auth.eu-west-1.amazoncognito.com/login?client_id=651p7go9kkj4j3fr78qph3j96t&response_type=token&scope=email+openid+profile&redirect_uri=https://rp.dyslexia.ie";
        b = "https://readable.auth.eu-west-1.amazoncognito.com/login?client_id=651p7go9kkj4j3fr78qph3j96t&response_type=token&redirect_uri=https://rp.dyslexia.ie";
        c = "https://qihx5f0xfa.execute-api.eu-west-1.amazonaws.com/Stage"
        d = "925322795697-i9jr2o8gkqan3cdqvkn7tjog5la33av6.apps.googleusercontent.com"
        e = "https://rp.dyslexia.ie"
}



export const readable_cognito_auth_url = a;
export const readable_cognito_logout_url = b;
export const api_url = c;
export const google_client_id = d;
export const frontend_url = e;