let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator.

        var params = {
            TableName: 'facilitator',
            Key: {
                'id': event.queryStringParameters.id
            }
        };

        var body = await dynamo.get(params).promise();


        response = {
            'statusCode': 200,
            'body': JSON.stringify(body),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
};