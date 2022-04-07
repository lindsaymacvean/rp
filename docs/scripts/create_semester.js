import { api_url } from "./utils/configs.js"

(function() {

    globalThis.createNewSemester = function(e) {
        e.preventDefault();
        console.log(api_url);
        var form = document.forms.namedItem("newSemester");
        var formData = new FormData(form);

        var data = JSON.stringify(Object.fromEntries(formData));
        console.log(data);
        axios.post(`${api_url}/semester/create`, data, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
                }
            })
            .then(resp => {
                console.log(resp);
                // var template = Handlebars.compile(document.querySelector("#facilitatorTemplate").innerHTML);
                // document.querySelector("#facilitatorsList").innerHTML = template({ facilitators: resp.data.Items });
            })

    }

})();