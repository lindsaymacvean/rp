const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    const item = {
        'name': data.name,
        'id': crypto.randomUUID()
    }

    var params = {
        TableName: 'semester',
        Item: item
    };

    var body = await dynamo.put(params).promise();

    response = {
        'statusCode': 200,
        'body': 'JSON.stringify(body)',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }
};