const redable_google_auth_url = "https://dyslexia.auth.eu-west-1.amazoncognito.com/login?client_id=91933533mop1fsmepjklman27&response_type=token&scope=email+openid+profile&redirect_uri=https://lindsaymacvean.github.io/rp/";

(function() {

    if (sessionStorage.getItem('id_token'))
        return;

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');

    if (id_token)
        sessionStorage.setItem('id_token', id_token);
    else {
        window.location.href = redable_google_auth_url;
    }

})();