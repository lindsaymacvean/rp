import { template_file_id, google_client_id } from "./utils/configs.js"
import { CurrentUserEmail } from "./utils/utils.js"
import { getTemplateFolder, getWeeksFiles, getFolderFiles, copyFile } from "./utils/drive.js"
import { getFacilitator, getGroup, getSemester } from "./utils/api.js";
import { stopLoading } from "./utils/loader.js";
import { logout }  from "./utils/logout.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

globalThis.logout = logout;

(function () {
    IsLoggedIn();

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');        

    let group = null;
    let semester = null;
    let facilitator = null;

    globalThis.search = (event) => {

        clearTimeout(globalThis.searchTimeout);

        globalThis.searchTimeout = setTimeout(() => {
            getTemplateFolder()
                .then(searchFiles)
        }, 1000)
    }

    globalThis.preview = (fileUrl) => {
        document.getElementById("preview-iframe").setAttribute("src", fileUrl);
        var previewModal = new bootstrap.Modal(document.getElementById('previewModal'))
        previewModal.show()
    }

    globalThis.openSession = (fileUrl) => {
        window.open(fileUrl, '_blank').focus();
    }

    globalThis.dragover_handler = (event) => {
        event.preventDefault();
    }

    globalThis.dragstart_handler = (event) => {
        event.dataTransfer.setData("text", event.target.id);
    }

    globalThis.drop_handler = (event, element) => {
        event.currentTarget.style.background = "lightyellow";
       
        event.preventDefault();
        var fileId = event.dataTransfer.getData("text");
        var parentFolderId = event.currentTarget.getAttribute('parentFolderId');
        var name = `${semester.name}-${group.studentYear}/${group.themes}-${event.srcElement.getAttribute("name").slice(-1)}/6-${facilitator.email}`;

        element.innerHTML = "";

        element.appendChild(document.getElementById(fileId).cloneNode(true));
        
        copyFile(
            fileId, 
            parentFolderId, 
            name
            )
            .then((result) => {console.log('result', result)});
    }

    document.getElementById('search_input').addEventListener("keyup", function (event) {
        // Number 13 is the "Enter" key on the keyboard
        var key = event.key || event.keyCode;
        if (key === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            search(event);
        }
    });

    function init(){
        gapi.load('client:auth2', (aa) => {
            gapi.client.init({
                client_id: google_client_id,
                scope: 'https://www.googleapis.com/auth/drive',
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                login_hint: CurrentUserEmail()
            })
                .then(checkSession)
                .then(function () {
                    return getTemplateFolder();
                })
                .then(function (folder) {
                    return getFiles(folder);
                })
                .then(() => getGroup(groupId))
                .then((groupResponse) => { group = groupResponse.data; return getFolderFiles(groupResponse.data.folderId)})
                .then((weekFolders) => getWeeksFiles(weekFolders))
                .then((weeks) => { weeks = weeks; setWeeksView(weeks); } )
                .then(() => getSemester(group.semesterId))
                .then((semesterResponse) => { semester = semesterResponse.data })
                .then(() => getFacilitator(group.facilitatorId))
                .then((facilitatorResponse) => { facilitator = facilitatorResponse.data.Item; stopLoading() })
        });
    }
   

    function checkSession(resp) {
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            return gapi.auth2.getAuthInstance().signIn();
        }
    }

    function getFiles(templateFolder) {
        return gapi.client.drive.files.list({
            q: `'${templateFolder.id}' in parents and trashed = false`,
            pageSize: 100,
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, webContentLink)',
        }).then(function (response) {
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: response.result.files });

            return response.result.files;
        });
    }

    function setWeeksView (weeks){
        var template = Handlebars.compile(document.querySelector("#weeksTemplate").innerHTML);
        document.querySelector("#weeksList").innerHTML = template({ weeks });
    }

    function searchFiles(templateFolder) {
        return gapi.client.drive.files.list({
            q: `'${templateFolder.id}' in parents and fullText contains '${document.getElementById("search_input").value}' and trashed = false`,
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, webContentLink)',
        }).then(function (response) {
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: response.result.files });

            return response.result.files;
        });
    }

    globalThis.openTemplate = function (e) {
        //e.preventDefault();

        var nameProp = e.currentTarget.getAttribute('name');
        var id = e.currentTarget.getAttribute('id');
        if (e.srcElement.innerHTML  === "Creating from Template ...")
            return;

        e.srcElement.innerHTML = "Creating from Template ..."

        var name =  `${semester.name}-${group.studentYear}/${group.themes}-${nameProp.slice(-1)}/6-${facilitator.email}`;
        copyFile(template_file_id, id, name)
            .then((result) => {
                window.open(result.result.webViewLink, '_blank').focus();
                init();
            })
    }

    init();
})();

