import { fillBreadcrumbs } from "./utils/breadcrumbs.js";
import { api_url } from "./utils/configs.js"
import { logout }  from "./utils/logout.js";

globalThis.logout = logout;

(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get('participantId');

    // if (document.querySelector("#adapt_session_button")) {
    //     var template = Handlebars.compile(document.querySelector("#adapt_session_button").outerHTML);
    //     document.querySelector("#adapt_session_button").outerHTML = template({ groupId });
    // }

    axios.get(`${api_url}/participant?id=${participantId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        // Fill out student details.
        .then(resp => {
            if (document.querySelector("#participant_title")) {
                var template = Handlebars.compile(document.querySelector("#participant_title").outerHTML);
                document.querySelector("#participant_title").outerHTML = template({ full_name: resp.data.child_name });
            }

            if (document.querySelector("#participant_details")) {
                var template = Handlebars.compile(document.querySelector("#participant_details").outerHTML);
                document.querySelector("#participant_details").outerHTML = template( resp.data );
            }

            return resp;
        })
        // Fill out student groups.
        .then(resp => {
            if (document.querySelector("#groupsListTemplate")) {
                var template = Handlebars.compile(document.querySelector("#groupsListTemplate").innerHTML);
                document.querySelector("#groupsList").outerHTML = template({ groups: resp.data.groups });
            }

            return resp;
        })
        .then((resp) => {
            fillBreadcrumbs(resp);
        })

    globalThis.updateParticipant = function (e) {
        e.preventDefault();
        var data = {};
        data.child_name = e.target.child_name.value;
        data.parent_name = e.target.parent_name.value;
        axios.put(`${api_url}/participant?id=${participantId}`, data, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
          })
          .then((response) => {
                var myModal = new bootstrap.Modal(document.getElementById("updatedConfirmation"), {});
                myModal.show();
          });
    }
})();