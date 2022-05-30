import { api_url } from "./utils/configs.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

(function() {
    IsLoggedIn();
    
    axios.get(`${api_url}/facilitator/list`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#facilitatorTemplate").innerHTML);
            document.querySelector("#facilitatorsList").innerHTML = template({ facilitators: resp.data.Items });
        })
})();