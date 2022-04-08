let response;
const AWS = require('aws-sdk');
const readline = require('readline');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];


exports.handler = async(event, context) => {

    try {

        var accessToken = event.requestContext.authorizer.claims["custom:googleAccessToken"]

        const oAuth2Client = new google.auth.OAuth2();

        oAuth2Client.setCredentials({
            access_token: accessToken
        });

        const searchString = event.queryStringParameters ?
            event.queryStringParameters.searchString :
            null;

        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        var goldenSessionPlanFolder = (await drive.files.list({
            q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder' and name='Golden Session Plan Library' and trashed = false",
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        })).data.files[0];

        console.log(goldenSessionPlanFolder);

        var files = searchString ?
            (await drive.files.list({
                q: `'${goldenSessionPlanFolder.id}' in parents and name contains '${searchString}' and trashed = false`,
                pageSize: 10,
                fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
            })) :
            (await drive.files.list({
                q: `'${goldenSessionPlanFolder.id}' in parents and trashed = false`,
                pageSize: 10,
                fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
            }));

        response = {
            'statusCode': 200,
            'body': JSON.stringify(files),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};