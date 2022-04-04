const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto")

exports.handler = async(event, context, callback) => {

    const item = {
        'email': event.request.userAttributes.email,
        'name': event.request.userAttributes.name,
        'given_name': event.request.userAttributes.given_name,
        'family_name': event.request.userAttributes.family_name,
        'id': crypto.randomUUID()
    }

    var params = {
        TableName: 'facilitator',
        Item: item
    };

    var body = await dynamo.put(params).promise();

    // Set the user pool autoConfirmUser flag
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    callback(null, event);
};