let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        var params = {
            TableName: 'facilitator',
        };

        var facilitators = await dynamo.query(params).promise();

        response = {
            'statusCode': 200,
            'body': JSON.stringify(facilitators),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};