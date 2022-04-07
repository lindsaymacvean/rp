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

        const searchString = event.queryStringParameters.searchString;

        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        var goldenSessionPlanFolder = (await drive.files.list({
            q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder' and name='Golden Session Plan Library' and trashed = false",
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        })).data.files[0];

        var files = (await drive.files.list({
            q: `1DVgRECL8X2ZOTp7qGZQ9LYJ-Zh9-21y6 in parents and mimeType = 'application/vnd.google-apps.folder' and name contains '${searchString}' and trashed = false`,
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