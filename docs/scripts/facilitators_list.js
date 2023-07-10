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
            console.log(resp.data.Items);
            resp.data.Items.sort((a,b)=> {
                return (a.given_name+a.family_name).localeCompare((b.given_name+b.family_name));
            })
            var template = Handlebars.compile(document.querySelector("#facilitatorTemplate").innerHTML);
            document.querySelector("#facilitatorsList").innerHTML = template({ facilitators: resp.data.Items });
        })
})();