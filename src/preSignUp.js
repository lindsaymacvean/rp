const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto")

exports.handler = async(event, context, callback) => {

    console.log(JSON.stringify(event));

    const item = {
        'email': event.request.userAttributes.email,
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