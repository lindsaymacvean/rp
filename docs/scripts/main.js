import { readable_cognito_auth_url, readable_cognito_logout_url, frontend_url } from "./utils/configs.js"
import { IsLeadFacilitator } from "./utils/utils.js"

(function() {

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');

    if (sessionStorage.getItem('id_token')){
        return;
    }

    if (id_token) {
        sessionStorage.setItem('id_token', id_token);
    } else {
        window.location.href = readable_cognito_auth_url;
    }

})();

globalThis.logout = function logout(e) {
    e.preventDefault();
    window.location.href = readable_cognito_logout_url;
}