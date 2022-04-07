let response;
const AWS = require('aws-sdk');
var ssm = new AWS.SSM();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

exports.handler = async(event, context) => {

    try {
        var authCode = null;
        
        if (event?.queryStringParameters?.code){
            authCode = await oauth2Client.getToken(event.queryStringParameters.code).tokens;
        }

        if (!authCode){
            const googleClientId = await ssm.getParameter({
                Name: process.env.GOOGLE_CLIENT_ID,
                WithDecryption: true
            }).promise();
    
            const googleClientSecret = await ssm.getParameter({
                Name: process.env.GOOGLE_CLIENT_SECRET,
                WithDecryption: true
            }).promise();
    
            const oauth2Client = new google.auth.OAuth2(
                googleClientId.Parameter.Value,
                googleClientSecret.Parameter.Value,
                /*
                 * This is where Google will redirect the user after they
                 * give permission to your application
                 */
                process.env.GOOGLE_REDIRECT_URL,
            );
    
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                prompt: 'consent',
                scope: SCOPES,
            });
    
            return {
                'statusCode': 200,
                'body': JSON.stringify({authUrl: authUrl}),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        }
        else {
            await cloneTemplateFolder(authCode);
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

async function cloneTemplateFolder(auth) {
    const drive = google.drive({ version: 'v3', auth });

    var templateFolder = (await drive.files.list({
            q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder' and name='Golden Session Plan Library' and trashed = false",
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