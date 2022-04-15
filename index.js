const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', async (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    await cloneTemplateFolder({key: 'AIzaSyDJtb7W-3aO8qdJpJ1SEkrkoAldStUY8WI'});
});

async function cloneTemplateFolder(auth) {
    const drive = google.drive({ 
        version: 'v3', 
        auth: 'AIzaSyDJtb7W-3aO8qdJpJ1SEkrkoAldStUY8WI' });

    var templateFolder = (await drive.files.list({
            q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder' and name='Template Files' and trashed = false",
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
    })).data.files[0];

    await cloneFoldersRecursivly(drive, templateFolder, {id: 'root'})
}

async function cloneFoldersRecursivly (drive, source, destination) {

    var newFolder = (await drive.files.create({
        resource: {
            mimeType: 'application/vnd.google-apps.folder',
            name: source.name,
            parents: [destination.id]
        }
    })).data;

    const templateFiles = (await drive.files.list({
        q: `'${source.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        pageSize: 100,
        fields: 'nextPageToken, files(id, name)'
    })).data.files

    templateFiles.forEach(async file => {
        const cloned = (await drive.files.copy({
            fileId: file.id,
            resource: {
                name: `${file.name}`,
                parents: [newFolder.id]
            }
        })).data;
    })

     // Find all sub-folders
     const folders = (await drive.files.list({
        q: `'${source.id}' in parents and mimeType =  'application/vnd.google-apps.folder' and trashed = false`,
        pageSize: 100,
        fields: 'nextPageToken, files(id, name)'
    })).data.files;

    console.log(folders)

    folders.forEach(folder => cloneFoldersRecursivly(drive, folder, newFolder))

}