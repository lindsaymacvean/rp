import { api_url, google_client_id } from "./utils/configs.js"
import { CurrentUserEmail } from "./utils/utils.js"
import { getTemplateFolder } from "./utils/drive.js"

(function() {

          // Use the API Loader script to load google.picker and gapi.auth.
          function onApiLoad() {
            gapi.load('auth2', onAuthApiLoad);
            gapi.load('picker', onPickerApiLoad);
          }
        

    globalThis.search = (event) => {

        clearTimeout(globalThis.searchTimeout);

        globalThis.searchTimeout = setTimeout(() => {
            getTemplateFolder()
                .then(searchFiles)
        }, 1000)

    }

    globalThis.preview = (fileUrl) => {
        window.open(fileUrl, '_blank', 'popup').focus();
    }
        // Number 13 is the "Enter" key on the keyboard
        var key = event.key || event.keyCode;
        if (key === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          search(event);
        }
    });

    gapi.load('client:auth2', (aa) => {
        gapi.client.init({
                client_id: google_client_id,
                scope: 'https://www.googleapis.com/auth/drive',
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                login_hint: CurrentUserEmail()
            })
            .then(checkSession)
            .then(function() {
                return getTemplateFolder();
            })
            .then(function(folder) {
                return getFiles(folder);
            });
    });

    function checkSession() {
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

    function searchFiles(templateFolder) {
        return gapi.client.drive.files.list({
            q: `'${templateFolder.id}' in parents and fullText contains '${document.getElementById("search_input").value}' and trashed = false`,
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