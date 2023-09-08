import { api_url } from "./utils/configs.js";
import { IsLeadFacilitator, Logout } from "./utils/utils.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";
import { frontend_url } from "./utils/configs.js"

globalThis.logout = Logout;

(function() {
    IsLoggedIn();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    let facilitatorEnabled;

    axios.get(`${api_url}/facilitator?id=${id}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            let data = resp.data.Item;
            // Do not display groups older than a 3 months
            data.groups = Object.values(data.groups).filter((a) => {
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
            facilitatorEnabled = data.facilitatorEnabled === null || data.facilitatorEnabled === undefined ? true : data.facilitatorEnabled;
            let template = Handlebars.compile(document.querySelector("#facilitatorDataTemplate").innerHTML);
            document.querySelector("#facilitatorData").innerHTML = template({
                IsLeadFacilitator, 
                data, 
                facilitatorEnabled
            });
            return resp;
        });
    
    globalThis.disableFacilitator = function (e) {
        e.preventDefault();
        let actionWord = facilitatorEnabled ? "disable" : "enable";
        let confirmAction = confirm(`Warning! You are about to ${actionWord} this facilitator.`);
        if (confirmAction) {
            let requestEndpoint = facilitatorEnabled ? `${api_url}/facilitator/disable?id=${id}` : `${api_url}/facilitator/enable?id=${id}`;
            axios.put(requestEndpoint, {}, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
                }
            })
            .then((response) => {
                facilitatorEnabled = !facilitatorEnabled;
                alert(`Facilitator was successfully ${actionWord}d!`);
                document.querySelector("#disable_facilitator_button button").textContent = facilitatorEnabled ? "Disable Facilitator" : "Enable Facilitator";
                window.location.reload();

            })
            .catch(function(error) {
                alert(`Facilitator was not ${actionWord}d, possibly because of a network connection error.`)
            });
        }
    };
        

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
                alert('Facilitator was not updated, possibly because of a network connection error.')
            });
    }
})();