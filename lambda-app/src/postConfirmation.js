// https://aws.amazon.com/blogs/security/how-to-secure-api-gateway-http-endpoints-with-jwt-authorizer/
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context, callback) => {

    const item = {
        'email': event.request.userAttributes.email,
        'name': event.request.userAttributes.name,
        'given_name': event.request.userAttributes.given_name,
        'family_name': event.request.userAttributes.family_name,
        'id': event.request.userAttributes.sub
    }

    var params = {
        TableName: 'facilitator',
        Item: item
    };

    var body = await dynamo.put(params).promise();

    callback(null, event);
};