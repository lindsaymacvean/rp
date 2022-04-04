const redable_google_auth_url = "https://aromakh.auth.eu-west-2.amazoncognito.com/login?client_id=443ahpd9l151fmj7b8h4df5qi5&response_type=token&scope=email+openid+profile&redirect_uri=http://localhost:3000/docs/index.html";

(function() {

    if (sessionStorage.getItem('id_token'))
        return;

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');
    debugger
    if (id_token)
        sessionStorage.setItem('id_token', id_token);
    else {
        window.location.href = redable_google_auth_url;
    }

})();