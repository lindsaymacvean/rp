import { fillBreadcrumbs } from "./utils/breadcrumbs.js";
import { api_url } from "./utils/configs.js"
import { Logout }  from "./utils/utils.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

globalThis.logout = Logout;

(function() {
    IsLoggedIn();

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
        // Add Student Group to Breadcrumb
        // Student only has one group
        .then(resp => {
            if (document.querySelector("#breadCrumbGroupTemplate")) {
                var template = Handlebars.compile(document.querySelector("#breadCrumbGroupTemplate").innerHTML);
                document.querySelector("#breadCrumbGroup").outerHTML = template({ groups: resp.data.groups });
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
          })
          .catch(function(error) {
                alert('Participant was not updated, possibly because of a network connection error.')
          });
    }
})();