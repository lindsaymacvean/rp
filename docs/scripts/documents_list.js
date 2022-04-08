import { api_url } from "./utils/configs.js"

(function() {

    globalThis.search = (event) => {

        clearTimeout(globalThis.searchTimeout);

        globalThis.searchTimeout = setTimeout(() => {
            axios.get(`${api_url}/documents?searchString=${document.getElementById("search_input").value}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
                    }
                })
                .then(resp => {
                    var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
                    document.querySelector("#documentsList").innerHTML = template({ documents: resp.data.data.files });
                })

        }, 1000)

    }

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