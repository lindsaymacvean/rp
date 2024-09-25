import { general_template_file_id, first_second_file_id, google_client_id } from "./utils/configs.js";
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

    async function init() {
        try {
            await new Promise((resolve, reject) => {
                gapi.load('client:auth2', (aa) => {
                    gapi.client.init({
                        client_id: google_client_id,
                        scope: 'https://www.googleapis.com/auth/drive',
                        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                        login_hint: CurrentUserEmail()
                    }).then(resolve).catch(reject);
                });
            });
    
            const signedIn = await checkSession();
            if (!signedIn) throw new Error('Google is not signed in.');
    
            try {
                const templateFolder = await getTemplateFolder();
                if (!templateFolder) throw new Error('No template folder defined');
                await getFiles(templateFolder);
            } catch (error) {
                console.log(error);
                alert("Warning: You don't have access to the Golden Session Library. Please contact the administrator.");
            }
    
            const groupResponse = await getGroup(groupId);
            if (!groupResponse || !groupResponse.data) throw new Error('No Group Data.');
            group = groupResponse.data;

            const facilitatorResponse = await getFacilitator(group.facilitatorId);
            if (!facilitatorResponse || !facilitatorResponse.data || !facilitatorResponse.data.Item) throw new Error('facilitatorResponse is empty');
            // Here asign the global facilitator variable to the returned data
            console.log(facilitatorResponse);
            facilitator = facilitatorResponse.data.Item;
    
            const weekFolders = await getFolderFiles(group.folderId);
            if (!weekFolders) throw new Error('Failed to get week folders.');
    
            const weeks = await getWeeksFiles(weekFolders);
            if (!weeks) throw new Error('Failed to get weeks files.');
            setWeeksView(weeks);
    
            if (!group) throw new Error('No Group Found');
            const semesterResponse = await getSemester(group.semesterId);
            if (!semesterResponse || !semesterResponse.data) throw new Error('semesterResponse is empty');
            semester = semesterResponse.data;
            
            stopLoading();
    
            const openDirectoryTemplate = Handlebars.compile(document.querySelector("#openDirectoryTemplate").innerHTML);
            document.querySelector("#openDirectory").outerHTML = openDirectoryTemplate({ IsLeadFacilitator });
    
        } catch (error) {
            console.log(error);
        }
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
        // If the group is a 1st/2nd year it should have a different template
         // Regex to match 1st or 2nd Class
        const classMatch = new RegExp("(1st|2nd)", "gi");
        let firstorsecond = classMatch.test(group.name);
        let file_id = firstorsecond ? first_second_file_id: general_template_file_id;
        copyFile(file_id, id, name)
            .then((result) => {
                window.open(result.result.webViewLink, '_blank').focus();
                location.reload(true);
            })
    }

    if (typeof groupId !== 'undefined' && groupId !== null) init();
})();

