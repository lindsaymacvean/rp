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
            // Do not display groups older than a 3 months
            resp.data.Item.groups = Object.values(resp.data.Item.groups).filter((a) => {
                var dateOfSession = new Date(a.dateOfFirstSession);
                
                var todaysDate = new Date();
                var difference = todaysDate - dateOfSession;
                console.log(dateOfSession, todaysDate, difference)
                if (difference > 1 * 1000 * 60 * 60 * 24 * 30 * 3) {
                    console.log(a, 'is too old')
                    return false;
                } else {
                    return true;
                }
            });
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