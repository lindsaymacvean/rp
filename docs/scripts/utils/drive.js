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

export const shareFile = (fileId, permission, email, type='user') => {

    var permission = {
          'type': type,
          'role': permission
    };

    if (type === 'domain') permission['domain'] = 'dyslexia.ie';
    if (type === 'user') permission['emailAddress'] = email

    gapi.client.drive.permissions.create({
        resource: permission,
        fileId: fileId,
        fields: 'id',
    });

    return fileId;

}

export const shareTemplateFolder = (email) => {
    return getTemplateFolder()
        .then((tempateFolder) => shareFile(tempateFolder.id, "reader", email, type='user'));
}

export const getTemplateFolder = () => {
    return gapi.client.drive.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and name = 'Golden Session Plan Library' and trashed = false",
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }).then(function(response) {
        return response.result.files[0];
    });
}

function checkSession() {
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        return gapi.auth2.getAuthInstance().signIn();
    }
}

export const createGroupFolder = (semesterName, groupName, theme, studentYear, facilitatorId, year, facilitatorEmail) => {
    return createFolder(`${semesterName}-${groupName}-${studentYear}/${theme}-${facilitatorEmail}`)
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



export const copyFile = (fileId, parentFolderId, name) => {
    return gapi.client.drive.files.copy({
        fileId: fileId,
        parents: [parentFolderId],
        name: name,
        fields: 'id, name, parents, thumbnailLink, webViewLink, iconLink, webContentLink',
      });
}

export const getFolderFiles = (parentId) => {
    return gapi.client.drive.files.list({
        q: `'${parentId}' in parents and trashed = false`,
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, parents, thumbnailLink, webViewLink, iconLink, webContentLink)',
    }).then(function(response) {
        return response.result.files;
    });
}

export const getWeeksFiles = (parents) => {

    var weeks = parents.map(r => {return { name: r.name, id: r.id, files: []}});

    return getFolderFiles(weeks[0].id)
        .then((weekFiles) => { weeks[0].files = weekFiles; return getFolderFiles(weeks[1].id) })
        .then((weekFiles) => { weeks[1].files = weekFiles; return getFolderFiles(weeks[2].id) })
        .then((weekFiles) => { weeks[2].files = weekFiles; return getFolderFiles(weeks[3].id) })
        .then((weekFiles) => { weeks[3].files = weekFiles; return getFolderFiles(weeks[4].id) })
        .then((weekFiles) => { weeks[4].files = weekFiles; return getFolderFiles(weeks[5].id) })
        .then((weekFiles) => { 
            weeks[5].files = weekFiles; 
            return weeks.sort(function(a, b){
                if(a.name < b.name) { return -1; }
                if(a.name > b.name) { return 1; }
                return 0;
            }) 
        })
}

export const createGroupSubFolders = (parentFolderId) => {
    return createFolder("Week 1", parentFolderId)
        .then(() => createFolder("Week 2", parentFolderId))
        .then(() => createFolder("Week 3", parentFolderId))
        .then(() => createFolder("Week 4", parentFolderId))
        .then(() => createFolder("Week 5", parentFolderId))
        .then(() => createFolder("Week 6", parentFolderId))
        .then(() => parentFolderId);
}