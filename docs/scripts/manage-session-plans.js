import { api_url, google_client_id } from "./utils/configs.js"
import { CurrentUserEmail } from "./utils/utils.js"
import { getTemplateFolder, getWeeksFiles, getFolderFiles, copyFile } from "./utils/drive.js"
import { getGroup } from "./utils/api.js";

(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');        

    let group = null;
    let weeks = [];
   
    globalThis.search = (event) => {

        clearTimeout(globalThis.searchTimeout);

        globalThis.searchTimeout = setTimeout(() => {
            getTemplateFolder()
                .then(searchFiles)
        }, 1000)
    }

    globalThis.preview = (fileUrl) => {
        document.getElementById("preview-iframe").setAttribute("src", fileUrl);

        var myModal = new bootstrap.Modal(document.getElementById('exampleModal'))
        myModal.show()
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

        if (el.innerHTML.startsWith("<span"))
            el.innerHTML = "";

        el.appendChild(document.getElementById(sourceId).cloneNode(true));
        
        copyFile(sourceId, ev.currentTarget.id)
            .then((result) => {debugger; console.log(result)})
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

    gapi.load('client:auth2:picker', (aa) => {
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
            // .then(() => getGroup(groupId))   
            .then((groupResponse) => getFolderFiles(groupResponse.data.folderId))
            .then((weekFolders) => getWeeksFiles(weekFolders))
            .then((weeks) => { weeks = weeks; setWeeksView(weeks) } );
    });

    function createPicker() {
        if (gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token) {
            var view = new google.picker.DocsView()
                // .setParent('PUT YOUR FOLDER ID')
                .setIncludeFolders(true);

            var picker = new google.picker.PickerBuilder().
                addView(view).
                setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token).
                //   setDeveloperKey('AIzaSyA3NSksANfrgDTQDrSduZZIU17R2udcbRo').
                setCallback(pickerCallback).
                build();
            picker.setVisible(false);
        }
    }

    function pickerCallback(data) {
        var url = 'nothing';
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            var doc = data[google.picker.Response.DOCUMENTS][0];
            url = doc[google.picker.Document.URL];
        }
        var message = 'You picked: ' + url;
        document.getElementById('result').innerHTML = message;
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
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink)',
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
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
        }).then(function (response) {
            console.log(response);
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: response.result.files });

            return response.result.files;
        });
    }
})();