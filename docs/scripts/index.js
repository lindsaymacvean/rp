import { redable_google_auth_url, google_client_id } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');

    if (sessionStorage.getItem('id_token'))
        return;

    if (id_token) {
        sessionStorage.setItem('id_token', id_token);
    } else {
        window.location.href = redable_google_auth_url;
    }


})();