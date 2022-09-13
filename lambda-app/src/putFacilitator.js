const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);
    data.id = event.queryStringParameters.id;

    // Check if lead facilitator
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');

        if (!data.zoom_link) {
            return {
                'statusCode': 422,
                'body': 'Missing zoom_link',
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        }

        var UpdateExpression = 'set zoom_link = :zoom_link';
        var ExpressionAttributeValues = {
            ':zoom_link': data.zoom_link
        }

        var params = {
            TableName: 'facilitator',
            Key: {
                'id': data.id
            },
            UpdateExpression,
            ExpressionAttributeValues
        };

        try {
            await dynamo.update(params).promise();
        } catch(e) {
            console.log(e);
        }
        

        // TODO: choose a dns entry, accept zoom id and update S3 bucket 

        response = {
            'statusCode': 200,
            'body': 'ok',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    } else {
        console.log('user is not a lead facilitator');
        response = {
            'statusCode': 403,
            'body': 'user is not a lead facilitator',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }

    return response;
};