import { general_template_file_id, first_second_file_id, google_client_id } from "./utils/configs.js";
import { CurrentUserEmail, Logout, IsLeadFacilitator } from "./utils/utils.js";
import { getTemplateFolder, getWeeksFiles, getFolderFiles, copyFile, initDrive, createFolder, createGroupSubFolders, shareFileWithDomain, transferOwnership } from "./utils/drive.js";
import { getFacilitator, getGroup, getSemester, saveFolderIdToGroup } from "./utils/api.js";
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
            console.log('group', group);

            const facilitatorResponse = await getFacilitator(group.facilitatorId);
            if (!facilitatorResponse || !facilitatorResponse.data || !facilitatorResponse.data.Item) throw new Error('facilitatorResponse is empty');
            // Here asign the global facilitator variable to the returned data
            console.log('facilitatorResponse', facilitatorResponse);
            facilitator = facilitatorResponse.data.Item;
    
            // Load semester data first
            if (!group) throw new Error('No Group Found');
            const semesterResponse = await getSemester(group.semesterId);
            if (!semesterResponse || !semesterResponse.data) throw new Error('semesterResponse is empty');
            semester = semesterResponse.data;
            
            // Now check if group has a folderId before attempting to get folder files
            console.log('Group folderId:', group.folderId);
            
            let isLeadFacilitator = false;
            try {
                isLeadFacilitator = IsLeadFacilitator();
                console.log('IsLeadFacilitator:', isLeadFacilitator);
            } catch (error) {
                console.error('Error checking lead facilitator status:', error);
                isLeadFacilitator = false;
            }
            
            if (!group.folderId) {
                // Temporary: Always show create directory option for testing (remove in production)
                console.log('Group has no folderId, showing create directory option');
                showCreateDirectoryOption();
                return;
                
                // Original logic (uncomment when ready for production):
                // if (isLeadFacilitator) {
                //     console.log('Showing create directory option for lead facilitator');
                //     showCreateDirectoryOption();
                //     return; // Don't throw error, show the create directory option instead
                // } else {
                //     throw new Error('Group folder not found. Please contact the administrator to set up the group folder.');
                // }
            }
    
            const weekFolders = await getFolderFiles(group.folderId);
            if (!weekFolders) throw new Error('Failed to get week folders.');
    
            const weeks = await getWeeksFiles(weekFolders);
            if (!weeks) throw new Error('Failed to get weeks files.');
            setWeeksView(weeks);
            
            stopLoading();
    
            const openDirectoryTemplate = Handlebars.compile(document.querySelector("#openDirectoryTemplate").innerHTML);
            document.querySelector("#openDirectory").outerHTML = openDirectoryTemplate({ IsLeadFacilitator });
            
            // Add test button for lead facilitators (remove this in production)
            if (IsLeadFacilitator()) {
                const testButton = document.createElement('div');
                testButton.innerHTML = `
                    <button class="btn btn-warning btn-sm mt-2" onclick="testCreateDirectory()">
                        <i class="fas fa-bug me-1"></i>Test Create Directory (Debug)
                    </button>
                `;
                document.querySelector("#openDirectory").appendChild(testButton);
            }
    
        } catch (error) {
            console.error('Error in init function:', error);
            console.error('Error stack:', error.stack);
            stopLoading();
            
            // Show user-friendly error message
            const errorMessage = error.message || 'An unexpected error occurred';
            document.querySelector("#weeksList").innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error Loading Session Plans</h4>
                    <p><strong>Error:</strong> ${errorMessage}</p>
                    <hr>
                    <p class="mb-0">Please try refreshing the page or contact the administrator if the problem persists.</p>
                    <button class="btn btn-outline-danger btn-sm mt-2" onclick="console.log('Error details:', '${errorMessage}')">
                        Log Error Details
                    </button>
                </div>
            `;
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

    function showCreateDirectoryOption() {
        console.log('showCreateDirectoryOption called');
        console.log('Group:', group);
        console.log('Semester:', semester);
        console.log('Facilitator:', facilitator);
        
        stopLoading();
        
        const createDirectoryHTML = `
            <div class="alert alert-warning" role="alert">
                <h4 class="alert-heading">Group Directory Not Found</h4>
                <p>This group doesn't have a Google Drive directory set up yet. As a lead facilitator, you can create one now.</p>
                <hr>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Group:</strong> ${group.name}<br>
                        <strong>Semester:</strong> ${semester.name}<br>
                        <strong>Facilitator:</strong> ${facilitator.email}
                    </div>
                    <button class="btn btn-primary" onclick="createGroupDirectory()">
                        <i class="fas fa-folder-plus me-2"></i>Create Google Directory
                    </button>
                </div>
            </div>
        `;
        
        console.log('Setting innerHTML to:', createDirectoryHTML);
        const weeksListElement = document.querySelector("#weeksList");
        console.log('weeksList element:', weeksListElement);
        
        if (weeksListElement) {
            weeksListElement.innerHTML = createDirectoryHTML;
            console.log('HTML set successfully');
        } else {
            console.error('Could not find #weeksList element');
        }
    }

    // Test function to show create directory interface (remove in production)
    globalThis.testCreateDirectory = function() {
        console.log('Testing create directory interface');
        showCreateDirectoryOption();
    }

    globalThis.createGroupDirectory = async function() {
        try {
            // Show loading state
            document.querySelector("#weeksList").innerHTML = `
                <div class="alert alert-info" role="alert">
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div>
                            <strong>Creating Google Directory...</strong><br>
                            Please wait while we set up the group folder and permissions.
                        </div>
                    </div>
                </div>
            `;

            console.log('Step 1: Initializing Google Drive...');
            // Initialize Google Drive
            await initDrive();
            console.log('Step 1: Google Drive initialized successfully');
            
            // Create the group folder
            const folderName = `${semester.name}-${group.name}-${group.studentYear}/${group.themes}-${facilitator.email}`;
            console.log('Step 2: Creating folder with name:', folderName);
            console.log('Step 2: Current user email:', CurrentUserEmail());
            
            let parentFolderId;
            try {
                const folderResult = await createFolder(folderName);
                console.log('Step 2: Folder creation response:', folderResult);
                parentFolderId = folderResult.result.id;
                console.log('Step 2: Folder created with ID:', parentFolderId);
            } catch (folderError) {
                console.error('Step 2: Folder creation failed:', folderError);
                throw new Error(`Failed to create folder: ${folderError.message}. This might be a permissions issue. Please check if you can create folders in your Google Drive.`);
            }
            
            // Create subfolders
            console.log('Step 3: Creating subfolders...');
            await createGroupSubFolders(parentFolderId);
            console.log('Step 3: Subfolders created successfully');
            
            // Save folder ID to group
            console.log('Step 4: Saving folder ID to group...');
            await saveFolderIdToGroup(parentFolderId, group);
            console.log('Step 4: Folder ID saved to group');
            
            // Share with domain
            console.log('Step 5: Sharing with domain...');
            await shareFileWithDomain(parentFolderId);
            console.log('Step 5: Shared with domain successfully');
            
            // Transfer ownership
            console.log('Step 6: Transferring ownership...');
            await transferOwnership(parentFolderId, 'readableproject@dyslexia.ie');
            console.log('Step 6: Ownership transferred successfully');
            
            // Success message
            document.querySelector("#weeksList").innerHTML = `
                <div class="alert alert-success" role="alert">
                    <h4 class="alert-heading">Directory Created Successfully!</h4>
                    <p>The Google Drive directory has been created and configured for this group.</p>
                    <hr>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Directory ID:</strong> ${parentFolderId}<br>
                            <a href="https://drive.google.com/drive/folders/${parentFolderId}" target="_blank" class="btn btn-outline-success btn-sm">
                                <i class="fas fa-external-link-alt me-1"></i>Open Directory
                            </a>
                        </div>
                        <button class="btn btn-success" onclick="location.reload()">
                            <i class="fas fa-refresh me-1"></i>Refresh Page
                        </button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error creating group directory:', error);
            console.error('Error stack:', error.stack);
            document.querySelector("#weeksList").innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error Creating Directory</h4>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Details:</strong> Check the console for more information.</p>
                    <hr>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            Please try again or contact the administrator if the problem persists.
                        </div>
                        <button class="btn btn-outline-danger" onclick="showCreateDirectoryOption()">
                            <i class="fas fa-redo me-1"></i>Try Again
                        </button>
                    </div>
                </div>
            `;
        }
    }

    if (typeof groupId !== 'undefined' && groupId !== null) init();
})();

