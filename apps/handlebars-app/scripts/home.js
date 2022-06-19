import { frontend_url } from "./utils/configs.js"
import { IsLeadFacilitator } from "./utils/utils.js"
import { logout }  from "./utils/logout.js";

globalThis.logout = logout;

(function() {

    if (!IsLeadFacilitator())
        window.location.href = `${frontend_url}/facilitator_groups.html`;

})();