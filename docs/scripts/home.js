import { frontend_url } from "./utils/configs.js";
import { IsLeadFacilitator, Logout } from "./utils/utils.js";

globalThis.logout = Logout;

(function() {

    if (!IsLeadFacilitator())
        window.location.href = `${frontend_url}/facilitator_groups.html`;

})();