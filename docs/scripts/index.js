import { redable_google_auth_url, google_client_id } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');

    if (sessionStorage.getItem('id_token'))
        return;

    if (id_token) {
        sessionStorage.setItem('id_token', id_token);

        var idTokenDecoded = atob(id_token.split('.')[1]);
        const googleUserId = JSON.parse(idTokenDecoded).userId;

        const auth2Params = {
            client_id: google_client_id,
            immediate: true,
            login_hint: googleUserId,
        };

        gapi.load('client:auth2', (aa) => {
            gapi.auth2.init(auth2Params).then(res => {
                var token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
            })
        });
    } else {
        window.location.href = redable_google_auth_url;
    }


})();