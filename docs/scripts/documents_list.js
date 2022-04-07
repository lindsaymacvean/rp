import { api_url } from "./utils/configs.js"

(function() {

    axios.get(`${api_url}/documents`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: resp.data.data.files });
        })
})();