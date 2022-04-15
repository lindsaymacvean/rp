const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto")

exports.handler = async(event, context, callback) => {

    // Set the user pool autoConfirmUser flag
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    callback(null, event);
};