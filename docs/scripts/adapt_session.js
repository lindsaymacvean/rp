import { api_url, google_client_id } from "./utils/configs.js"

(function() {

    globalThis.search = (event) => {

        clearTimeout(globalThis.searchTimeout);

        globalThis.searchTimeout = setTimeout(() => {
            getTemplateFolder()
                .then(searchFiles)
        }, 1000)

    }


    gapi.load('client:auth2', (aa) => {
        gapi.client.init({
                client_id: google_client_id,
                scope: 'https://www.googleapis.com/auth/drive',
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            })
            .then(checkSession)
            .then(getTemplateFolder)
            .then((files) => getFiles(files));
    });

    function checkSession() {
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            return gapi.auth2.getAuthInstance().signIn();
        }
    }

    function getTemplateFolder() {
        return gapi.client.drive.files.list({
            q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder' and name='Golden Session Plan Library' and trashed = false",
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        }).then(function(response) {
            console.log(response);
            return response.result.files[0];
        });
    }

    function getFiles(templateFolder) {
        return gapi.client.drive.files.list({
            q: `'${templateFolder.id}' in parents and trashed = false`,
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
        }).then(function(response) {
            console.log(response);
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: response.result.files });

            return response.result.files;
        });
    }

    function searchFiles(templateFolder) {
        return gapi.client.drive.files.list({
            q: `'${templateFolder.id}' in parents and name contains '${document.getElementById("search_input").value}' and trashed = false`,
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
        }).then(function(response) {
            console.log(response);
            var template = Handlebars.compile(document.querySelector("#documentsTemplate").innerHTML);
            document.querySelector("#documentsList").innerHTML = template({ documents: response.result.files });

            return response.result.files;
        });
    }
})();