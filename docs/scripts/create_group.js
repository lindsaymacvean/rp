import { api_url } from "./utils/configs.js"

(function() {

    globalThis.createNewGroup = function(e) {
        e.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const semesterId = urlParams.get('semesterId');

        var form = document.forms.namedItem("newGroup");
        var formData = new FormData(form);

        var groupData = Object.fromEntries(formData);
        groupData.semesterId = semesterId;
        // var data = JSON.stringify(Object.fromEntries(formData));

        axios.post(`${api_url}/group/create`, groupData, {
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