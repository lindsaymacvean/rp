import { readable_cognito_auth_url, frontend_url } from "./configs.js"
import { IsLeadFacilitator } from "./utils.js"

export const IsLoggedIn = function() {
    // Set a timer to refresh page after 60 minutes to make sure people dont edit when not logged in
    // The token expires on the backend after 24 hours.
    setTimeout(window.location.reload.bind(window.location), 3600000);

    //TODO this is messy and can be refactored to be more elegant.

    // If no token then redirect to cognito
    if (!sessionStorage.getItem('id_token')) window.location.href = readable_cognito_auth_url;

    // If path is root and there is a token then redirect based on whether lead facilitator
    if (window.location.pathname === "/" && sessionStorage.getItem('id_token')) redirect();

    // If not root path then don't do anything
    if (window.location.pathname !== "/") return;
    
    // In the case that it is root path and there is no id_token then continue

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const id_token = urlParams.get('id_token');

    if (id_token) {
        sessionStorage.setItem('id_token', id_token);
        redirect();
    } else {
        window.location.href = readable_cognito_auth_url;
    }
}


function redirect() {
    if (IsLeadFacilitator())
        window.location.href = `${frontend_url}/home.html`;
    else
        window.location.href = `${frontend_url}/facilitator_groups.html`;
}