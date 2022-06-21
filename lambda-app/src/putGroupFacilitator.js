let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator
        
        // Get the group from the group table
        var data = JSON.parse(event.body);
        await updateGroup(data);

        var userDetails = event.requestContext.authorizer.claims;
        var facilitatorChange = {
            TableName: 'changelogs',
            Item: {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                event: {
                    user: userDetails,
                    description: `${userDetails.name} set facilitator for group ${data.id} to facilitatorId ${data.facilitatorId}.`
                }
            }
        }
        await dynamo.put(facilitatorChange).promise();

        response = {
            'statusCode': 200,
            'body': 'ok',
            'headers': {
                'Access-Control-Allow-Origin': '*'
            }
        }
    } catch (err) {
        return err;
    }
    return response
};

const updateGroup = async(data) => {

    var UpdateExpression = 'set facilitatorId = :facilitatorId';
    var ExpressionAttributeValues = {
        ':facilitatorId': data.facilitatorId
    }

    var params = {
        TableName: 'group',
        Key: {
            'id': data.id
        },
        UpdateExpression,
        ExpressionAttributeValues
    };
    await dynamo.update(params).promise();

};