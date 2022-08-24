const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    //TODO: check if current user is Lead Facilitator.
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');
    } else {
        console.log('user is not a lead facilitator');
    }
    
    //TODO validate data
    //TODO merge this with putGroupFacilitator using parameter overloading to determine what to update

    await updateGroup(data);

    response = {
        'statusCode': 200,
        'body': 'ok',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    return response;
};

const updateGroup = async(data) => {

    var UpdateExpression = 'set folderId = :folderId';
    var ExpressionAttributeValues = {
        ':folderId': data.folderId
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