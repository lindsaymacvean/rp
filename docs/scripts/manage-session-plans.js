import { template_file_id, api_url, google_client_id } from "./utils/configs.js"
import { CurrentUserEmail, CurrentUserName, CurrentUserId } from "./utils/utils.js"
import { getTemplateFolder, getWeeksFiles, getFolderFiles, copyFile } from "./utils/drive.js"
import { getFacilitator, getGroup, getSemester } from "./utils/api.js";
import { setLoading, stopLoading } from "./utils/loader.js";

(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');        

    let group = null;
    let semester = null;
    let facilitator = null;
    let weeks = [];
    // setLoading();

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

    globalThis.dragover_handler = (ev) => {
        console.log("dragOver");
        ev.preventDefault();
    }

    globalThis.dragstart_handler = (ev) => {
        console.log("dragStart");
        ev.dataTransfer.setData("text", ev.target.id);
    }

    globalThis.drop_handler = (ev, el) => {
        console.log("Drop");
        ev.currentTarget.style.background = "lightyellow";
       
        ev.preventDefault();
        var sourceId = ev.dataTransfer.getData("text");

        //if (el.innerHTML.startsWith("<span"))
        el.innerHTML = "";

        el.appendChild(document.getElementById(sourceId).cloneNode(true));
        
        copyFile(sourceId, ev.currentTarget.id, document.getElementById(sourceId).getAttribute("docName"))
            .then((result) => {console.log(result)})
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
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, webContentLink)',
        }).then(function (response) {
            console.log(response);
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
            console.log(response);
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: response.result.files });

            return response.result.files;
        });
    }

    globalThis.openTemplate = function (e) {
        e.preventDefault();
        if (e.srcElement.innerHTML  === "Copying...")
            return;

        e.srcElement.innerHTML = "Copying..."

        var name =  `${semester.name} - ${group.studentYear} / ${group.themes} - ${e.srcElement.getAttribute("name").slice(-1)}/6 - ${facilitator.name} F${group.facilitatorId}`;;
        console.log(name);
        copyFile(template_file_id, e.srcElement.parentElement.id, name)
            .then((result) => {
                window.open(result.result.webViewLink, '_blank').focus();
                init();
                console.log(result)
            })
    }

    init();
})();

