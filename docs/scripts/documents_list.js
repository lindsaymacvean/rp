import { api_url } from "./utils/configs.js"

(function() {

<<<<<<< HEAD
    var searchString = document.getElementById('exampleFormControlInput1').value;
    // axios.get('https://g3z09urod0.execute-api.eu-west-2.amazonaws.com/ReadableApiStage/documents', {
    axios.get(`https://hzk5v7sv55.execute-api.eu-west-1.amazonaws.com/ReadableApiStage/documents?searchString=${searchString}`, {
=======
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
>>>>>>> groupAndSemester
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: resp.data.data.files });
        })
})();