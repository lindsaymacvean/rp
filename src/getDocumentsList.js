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

        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        var files = (await drive.files.list({
            q: "",
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