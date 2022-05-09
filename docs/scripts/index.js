import { readable_cognito_auth_url, frontend_url } from "./utils/configs.js"
import { IsLeadFacilitator } from "./utils/utils.js"

(function() {
    if (sessionStorage.getItem('id_token')) redirect();

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');

    if (id_token) {
      sessionStorage.setItem('id_token', id_token);
      redirect();
    } else {
      window.location.href = readable_cognito_auth_url;
    }

    function redirect() {
        if (IsLeadFacilitator())
            window.location.href = `${frontend_url}/home.html`;
        else
            window.location.href = `${frontend_url}/facilitator_groups.html`;
    }
    
})();