let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator.

        var params = {
            TableName: 'semester'
        };

        var semesters = await dynamo.scan(params).promise();

        response = {
            'statusCode': 200,
            'body': JSON.stringify(semesters),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
};