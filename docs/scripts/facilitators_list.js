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

            const enabledFacilitators = resp.data.Items.filter(facilitator => facilitator.facilitatorEnabled !== false);
            const disabledFacilitators = resp.data.Items.filter(facilitator => facilitator.facilitatorEnabled === false);


            const enabledFacilitatorTemplate = Handlebars.compile(document.getElementById("enabledFacilitatorTemplate").innerHTML);
            const disabledFacilitatorTemplate = Handlebars.compile(document.getElementById("disabledFacilitatorTemplate").innerHTML);

            document.getElementById("enabledFacilitatorsList").innerHTML = enabledFacilitatorTemplate({enabledFacilitators});
            document.getElementById("disabledFacilitatorsList").innerHTML = disabledFacilitatorTemplate({disabledFacilitators});
        })
})();