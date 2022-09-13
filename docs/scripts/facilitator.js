import { api_url } from "./utils/configs.js";
import { logout }  from "./utils/logout.js";
import { IsLeadFacilitator } from "./utils/utils.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

globalThis.logout = logout;

(function() {
    IsLoggedIn();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    axios.get(`${api_url}/facilitator?id=${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var template = Handlebars.compile(document.querySelector("#facilitatorDataTemplate").innerHTML);
            document.querySelector("#facilitatorData").innerHTML = template({IsLeadFacilitator, data: resp.data.Item});
            return resp;
        });

    globalThis.updateFacilitator = function (e) {
        e.preventDefault();
        var data = {};
        data.zoom_link = e.target.zoom_link.value;
        axios.put(`${api_url}/facilitator?id=${id}`, data, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
            })
            .then((response) => {
                var myModal = new bootstrap.Modal(document.getElementById("updatedConfirmation"), {});
                myModal.show();
            })
            .catch(function(error) {
                alert('Participant was not updated, possibly because of a network connection error.')
            });
    }
})();