import { CurrentUserEmail } from "./utils.js"
import { google_client_id } from "./configs.js"


export const initDrive = () => {
    return new Promise((resolve, reject) => {
        gapi.load('client:auth2', () => {
            return gapi.client.init({
                client_id: google_client_id,
                scope: 'https://www.googleapis.com/auth/drive',
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                login_hint: CurrentUserEmail()
            })
            .then(checkSession)
            .then(resolve)
        })

    });
}

export const shareFile = (fileId, email, permission) => {

    var permission = {
          'type': 'user',
          'role': 'reader',
          'emailAddress': email
    };

    return gapi.client.drive.permissions.create({
        resource: permission,
        fileId: fileId,
        fields: 'id',
    });

}

export const shareTemplateFolder = (email) => {
    return getTemplateFolder()
        .then((tempateFolder) => shareFile(tempateFolder.id, email, "reader"));
}

export const getTemplateFolder = () => {
    return gapi.client.drive.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and name = 'Golden Session Plan Library' and trashed = false",
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }).then(function(response) {
        console.log(response);
        return response.result.files[0];
    });
}

function checkSession() {
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        return gapi.auth2.getAuthInstance().signIn();
    }
}

export const createGroupFolder = (semesterName, groupName, theme, studentYear, facilitatorId, facilitatorEmail) => {
    return createFolder(`${semesterName}-${groupName}-${studentYear}`)
        .then((folderResult) => createFolder(`${theme}-${facilitatorId}`, folderResult.result.id))
        .then((folderResult) => createGroupSubFolders(folderResult.result.id))
}

export const createFolder = (folderName, parentFolderId) => {
    var fileMetadata = {
        'name': folderName,
        'mimeType': 'application/vnd.google-apps.folder'
    };

    if (parentFolderId)
        fileMetadata.parents = [parentFolderId]

    return gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    })
}


export const createGroupSubFolders = (parentFolderId) => {
    return createFolder("week 1", parentFolderId)
        .then(() => createFolder("week 2", parentFolderId))
        .then(() => createFolder("week 3", parentFolderId))
        .then(() => createFolder("week 4", parentFolderId))
        .then(() => createFolder("week 5", parentFolderId))
        .then(() => createFolder("week 6", parentFolderId))
        .then(() => parentFolderId);
}