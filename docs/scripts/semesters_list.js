import { api_url } from "./utils/configs.js"
import { IsLoggedIn } from "./utils/isLoggedIn.js";

(function() {
    IsLoggedIn();
    axios.get(`${api_url}/semester/list`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#semesterTemplate").innerHTML);
            document.querySelector("#semestersList").innerHTML = template({ semesters: resp.data.Items });
        })
})();