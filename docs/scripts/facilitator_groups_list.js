import { api_url } from "./utils/configs.js"
import { logout }  from "./utils/logout.js";

globalThis.logout = logout;

(function() {

    axios.get(`${api_url}/group/facilitator`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            if (document.querySelector("#groupTemplate")) {
                var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
                document.querySelector("#groupsList").innerHTML = template({ groups: resp.data.Responses.group });
            }
            return resp;
        });
       
})();