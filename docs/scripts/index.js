import { readable_cognito_auth_url, readable_cognito_logout_url, frontend_url } from "./utils/configs.js"
import { IsLeadFacilitator } from "./utils/utils.js"

(function() {
    if (IsLeadFacilitator())
        window.location.href = `${frontend_url}/home.html`;
    else
        window.location.href = `${frontend_url}/facilitator_groups.html`;
})();