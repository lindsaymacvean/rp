import { getSemester } from "./utils/api.js";
import { api_url, frontend_url } from "./utils/configs.js"
import { createGroupFolder, initDrive, shareFile } from "./utils/drive.js"

(function () {

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

        axios.post(`${api_url}/group/create`, groupData, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        }).then(() => {
            const facilitatorEmailSelect = document.getElementById("facilitatorId");
            var facilitatorEmail= facilitatorEmailSelect.options[facilitatorEmailSelect.selectedIndex].text;

            initDrive()
                .then(() => getSemester(groupData.semesterId))
                .then((semesterResponse) => createGroupFolder(semesterResponse.data.name, groupData.name, groupData.themes, groupData.studentYear, groupData.facilitatorId, groupData.year, facilitatorEmail))
                .then((parentFolderId) => shareFile(parentFolderId, facilitatorEmail))
                .then(() => window.location.href = `${frontend_url}/semester.html?semesterId=${semesterId}`);

        });
    }
})();