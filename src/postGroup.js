const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    //TODO check if current user is Lead Facilitator.
    //TODO validate data

    const item = {
        'name': data.name,
        'dayOfWeek': data.dayOfWeek,
        'time': data.time,
        'dateOfFirstSession': data.dateOfFirstSession,
        'themes': data.themes,
        'facilitatorId': data.facilitatorId,
        'semesterId': data.semesterId,
        'id': crypto.randomUUID()
    }

    var params = {
        TableName: 'group',
        Item: item
    };

    var body = await dynamo.put(params).promise();

    response = {
        'statusCode': 200,
        'body': JSON.stringify(body),
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }
};