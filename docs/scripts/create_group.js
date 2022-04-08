import { api_url } from "./utils/configs.js"

(function() {

    var facilitators = [];

    axios.get(`${api_url}/facilitator/list`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            facilitators = resp.data.Items;
            var template = Handlebars.compile(document.querySelector("#facilitatorId").outerHTML);
            document.querySelector("#facilitatorId").outerHTML = template({ facilitators });
        })

    globalThis.createNewGroup = function(e) {
        e.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const semesterId = urlParams.get('semesterId');

        var form = document.forms.namedItem("newGroup");
        var formData = new FormData(form);

        var groupData = Object.fromEntries(formData);

        groupData.semesterId = semesterId;

        axios.post(`${api_url}/group/create`, groupData, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        });
    }

})();