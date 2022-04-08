import { api_url } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const semesterId = urlParams.get('semesterId');

    var template = Handlebars.compile(document.querySelector("#groups-btn").outerHTML);
    document.querySelector("#groups-btn").outerHTML = template({ semesterId });

    axios.get(`${api_url}/group/semester?semesterId=${semesterId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
            document.querySelector("#groupsList").innerHTML = template({ groups: resp.data });
        })
})();