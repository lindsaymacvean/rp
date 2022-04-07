import { api_url } from "./utils/configs.js"

(function() {
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