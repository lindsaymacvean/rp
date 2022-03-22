(function() {
    debugger;

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');
    sessionStorage.setItem('id_token', id_token);


})();