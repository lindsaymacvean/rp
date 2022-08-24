// This file is not currently being used by an endpoint

let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    return {
        'statusCode': 200,
        'body': 'it Worked!',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }
        var data = JSON.parse(event.body);

        var participant = (await getParticipant(data.participantId)).Item;
        participant.attend = participant.attend ?? {};
        participant.attend[data.groupId] = participant.attend[data.groupId] ?? {};
        participant.attend[data.groupId][data.weekId] = true;

        var params = {
            TableName: 'participant',
            Item: participant
        };
    
        await dynamo.put(params).promise();

        response = {
            'statusCode': 200,
            'body': JSON.stringify(participant),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
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