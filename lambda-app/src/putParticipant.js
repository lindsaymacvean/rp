const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);
    data.id = event.queryStringParameters.id;

    //TODO: check if current user is Lead Facilitator.
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');
    } else {
        console.log('user is not a lead facilitator');
    }
    //TODO validate data

    await updateParticipant(data);

    response = {
        'statusCode': 200,
        'body': 'ok',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    return response;
};

const getParticipant = async(participantId) => {
    var params = {
        TableName: 'participant',
        Key: {
            'id': participantId
        }
    };

    return await dynamo.get(params).promise();
};

const updateParticipant = async(data) => {

    if (!data.child_name || !data.parent_name) {
        return {
            'statusCode': 422,
            'body': 'Missing properties such as child_name or parent_name',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }

    var UpdateExpression = 'set child_name = :child_name,';
    UpdateExpression += ' parent_name = :parent_name,';
    UpdateExpression += ' parent_first_name = :parent_first_name,';
    UpdateExpression += ' parent_last_name = :parent_last_name';
    
    var ExpressionAttributeValues = {
        ':child_name': data.child_name,
        ':parent_name': data.parent_name,
        ':parent_first_name': data.parent_name.split(' ')[0],
        ':parent_last_name': data.parent_name.split(' ')[1]
    }

    // Add email, phone, and county if provided
    if (data.email) {
        UpdateExpression += ', email = :email';
        ExpressionAttributeValues[':email'] = data.email;
    }
    
    if (data.phone) {
        UpdateExpression += ', phone = :phone';
        ExpressionAttributeValues[':phone'] = data.phone;
    }
    
    if (data.county) {
        UpdateExpression += ', county = :county';
        ExpressionAttributeValues[':county'] = data.county;
    }

    var params = {
        TableName: 'participant',
        Key: {
            'id': data.id
        },
        UpdateExpression,
        ExpressionAttributeValues
    };
    await dynamo.update(params).promise();
};