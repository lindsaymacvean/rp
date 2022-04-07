import { api_url } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    axios.get(`${api_url}/facilitator?id=${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#facilitatorDataTempalte").innerHTML);
            document.querySelector("#facilitatorData").innerHTML = template(resp.data.Item);
        })

    axios.get(`${api_url}/group/list?facilitatorId=${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
            document.querySelector("#groupOutput").innerHTML = template({ groups: resp.data.Responses.group });
        })
})();