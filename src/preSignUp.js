const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto")

exports.handler = async(event, context) => {

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

    return {
        'statusCode': 200,
    }
};
