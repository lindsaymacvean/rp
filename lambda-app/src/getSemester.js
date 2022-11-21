const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {
    let response;
    const semesterId = event.queryStringParameters.id;
    if (!semesterId) {
        response = {
            'statusCode': 500,
            'body': 'The request had no semesterId',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }
    try {
        var semester = (await getSemester(semesterId)).Item;

        response = {
            'statusCode': 200,
            'body': JSON.stringify(semester),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        response = {
            'statusCode': 502,
            'body': 'There was an error looking for that semester.',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }

    return response
};

const getSemester = async(semesterId) => {
    var params = {
        TableName: 'semester',
        Key: {
            'id': semesterId
        }
    };

    return await dynamo.get(params).promise();
    
};
