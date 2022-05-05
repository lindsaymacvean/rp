import { getSemester } from "./utils/api.js";
import { getTicketTailorEvents } from "./utils/ticketTailor.js";
import { api_url, frontend_url } from "./utils/configs.js"
import { createGroupFolder, initDrive, shareFile, shareTemplateFolder } from "./utils/drive.js"

(function () {

    var facilitators = [];
    var ticketTailorEvents = [];

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

    getTicketTailorEvents()
        .then(resp => {
            ticketTailorEvents = resp.data;
            var template = Handlebars.compile(document.querySelector("#eventId").outerHTML);
            document.querySelector("#eventId").outerHTML = template({ ticketTailorEvents });

            document.getElementById("time").value = ticketTailorEvents[0].start.time;
            document.getElementById("dateOfFirstSession").value = ticketTailorEvents[0].start.date;

        })

    const saveFolderIdToGroup = (folderId, groupData) => {
        const data = {
            id: groupData.id,
            folderId
        }

        return axios.put(`${api_url}/group/update`, data, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        }).then(() => folderId);

    }

    globalThis.onTicketTailorEventChange = (ev, el) => {
        document.getElementById("time").value = ticketTailorEvents[ev.selectedIndex].start.time;
        document.getElementById("dateOfFirstSession").value = ticketTailorEvents[ev.selectedIndex].start.date;
    }

    globalThis.createNewGroup = function (e) {
        var form = document.forms.namedItem("newGroup");

        if (form.checkValidity())
            e.preventDefault();
        else
            return true;

        const urlParams = new URLSearchParams(window.location.search);
        const semesterId = urlParams.get('semesterId');

        form.checkValidity();

        var formData = new FormData(form);

        var groupData = Object.fromEntries(formData);

        groupData.semesterId = semesterId;

        const facilitatorEmailSelect = document.getElementById("facilitatorId");
        var facilitatorEmail= facilitatorEmailSelect.options[facilitatorEmailSelect.selectedIndex].text;

        var spinner = '<div style="text-align:center;"><div class="lds-dual-ring"></div><br /><strong>Importing Participants from Ticket Tailor</strong></div>';
        document.getElementsByTagName('body')[0].innerHTML = spinner; 


        axios.post(`${api_url}/group/create`, groupData, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        }).then((groupResponse) => {
            initDrive()
                .then(() => getSemester(groupData.semesterId))
                .then((semesterResponse) => createGroupFolder(semesterResponse.data.name, groupData.name, groupData.themes, groupData.studentYear, groupData.facilitatorId, groupData.year, facilitatorEmail))
                .then((parentFolderId) => saveFolderIdToGroup(parentFolderId, groupResponse.data))
                .then((parentFolderId) => shareFile(parentFolderId, facilitatorEmail, "writer"))
                .then((parentFolderId) => shareFile(parentFolderId, 'readableproject@dyslexia.ie', "writer"))
                .then((parentFolderId) => shareFile(parentFolderId, 'rptrial@dyslexia.ie', "writer"))
                // Don't need to shareTemplateFolder because template is already shared with organisation
                //.then(() => shareTemplateFolder(facilitatorEmail))
                .then(() => window.location.href = `${frontend_url}/semester.html?semesterId=${semesterId}`);
        });
    }
})();