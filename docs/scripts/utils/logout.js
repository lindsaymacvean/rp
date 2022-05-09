import { readable_cognito_logout_url } from "./configs.js";

export function logout(e) {
    e.preventDefault();
    sessionStorage.removeItem('id_token');
    window.location.href = readable_cognito_logout_url;
}