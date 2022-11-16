import { template_file_id, google_client_id } from "./utils/configs.js";
import { CurrentUserEmail, Logout, IsLeadFacilitator } from "./utils/utils.js";
import { getTemplateFolder, getWeeksFiles, getFolderFiles, copyFile } from "./utils/drive.js";
import { getFacilitator, getGroup, getSemester } from "./utils/api.js";
import { stopLoading } from "./utils/loader.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

globalThis.logout = Logout;

(function () {
    IsLoggedIn();

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');        

    let group = null;
    let semester = null;
    let facilitator = null;
    let parentDirectory = null;

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

        element.innerHTML = `<div class="lds-dual-ring"></div>`;
        
        copyFile(
            fileId, 
            parentFolderId, 
            name
            )
            .then((result) => {
                element.innerHTML= "";
                element.appendChild(document.getElementById(fileId).cloneNode(true));
                console.log('result', result);
                location.reload();
            });
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
                .then(function (signedin) {
                    if (typeof signedin === 'undefined' || signedin === null) return new Error('Google is not signed in.');
                    if (signedin instanceof Error) {
                        return signedin;
                    };
                    return getTemplateFolder();
                })
                .then(function (folder) {
                    if (folder instanceof Error) {
                        console.log(folder);
                        return;
                    }
                    return getFiles(folder);
                })
                .then(() => getGroup(groupId))
                .then((groupResponse) => { 
                    if (typeof groupResponse === 'undefined' || groupResponse === null) return new Error('No Group Data.');
                    if (groupResponse instanceof Error) {
                        return groupResponse;
                    };
                    group = groupResponse.data; 
                    return getFolderFiles(groupResponse.data.folderId)
                })
                .then((weekFolders) => {
                    if (weekFolders instanceof Error) {
                        return weekFolders;
                    };
                    return getWeeksFiles(weekFolders)
                })
                .then((weeks) => { 
                    if (weeks instanceof Error) {
                        console.log(weeks);
                        return weeks;
                    };
                    weeks = weeks; setWeeksView(weeks); 
                } )
                .then(() => {
                    if (typeof group === 'undefined' || group === null) return new Error('No Group Found');
                    if (group instanceof Error) {
                        console.log(group);
                        return group;
                    };
                    return getSemester(group.semesterId)
                })
                .then((semesterResponse) => {
                    if (typeof semesterResponse === 'undefined' || semesterResponse === null) {
                        console.log('semesterResponse is empty');
                        return new Error('semesterResponse is empty.');
                    }
                    if (semesterResponse instanceof Error) {
                        console.log(semesterResponse);
                        return;
                    };
                    semester = semesterResponse.data 
                })
                .then(() => {
                    if (typeof group === 'undefined' || group === null) return new Error('No Group Found');
                    if (group instanceof Error) {
                        console.log(group);
                        return group;
                    };
                    return getFacilitator(group.facilitatorId);
                })
                .then((facilitatorResponse) => { 
                    if (typeof facilitatorResponse === 'undefined' || facilitatorResponse === null) {
                        console.log('facilitatorResponse is empty');
                        return new Error('facilitatorResponse is empty.');
                    }
                    if (facilitatorResponse instanceof Error) {
                        console.log(facilitatorResponse);
                        return;
                    };
                    facilitator = facilitatorResponse.data.Item; 
                    stopLoading(); 
                })
                .then(() => {
                    let openDirectoryTemplate = Handlebars.compile(document.querySelector("#openDirectoryTemplate").innerHTML);
                    document.querySelector("#openDirectory").outerHTML = openDirectoryTemplate({ IsLeadFacilitator });
                })
                .catch((error) => {
                    console.log(error);
                });
        });
    }
   

    function checkSession() {
        try {
            if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                return gapi.auth2.getAuthInstance().signIn();
            } else {
                return gapi.auth2.getAuthInstance().isSignedIn.get();
            }
        } catch(e) {
            return e;
        }
        
    }

    function getFiles(templateFolder) {
        if (typeof templateFolder === 'undefined' || templateFolder === null) return new Error('No template folder defined');
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

    globalThis.openDirectory = function (e) {
        e.preventDefault();
        window.open('https://drive.google.com/drive/folders/'+group.folderId, '_blank').focus();
        return null;
    }

    globalThis.openTemplate = function (e) {
        //e.preventDefault();

        var nameProp = e.currentTarget.getAttribute('filename');
        var id = e.currentTarget.getAttribute('fileid');

        e.srcElement.innerHTML = "Creating from Template ..."

        var name =  `${semester.name}-${group.studentYear}/${group.themes}-${nameProp.slice(-1)}/6-${facilitator.email}`;
        copyFile(template_file_id, id, name)
            .then((result) => {
                window.open(result.result.webViewLink, '_blank').focus();
                init();
            })
    }

    if (typeof groupId !== 'undefined' && groupId !== null) init();
})();

