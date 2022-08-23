let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.  
        // Probably need to check the signature on this claim 
        // to make sure it has not been altered by the frontend
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }
        
        var data = JSON.parse(event.body);

        // Get the particpant from the participant table
        var participant = (await getParticipant(data.participantId)).Item;

        participant.attend = participant.attend ?? {};
        participant.attend[data.groupId] = participant.attend[data.groupId] ?? {};

        // If particpant already marked as attending then mark as not attending
        var group = participant.attend[data.groupId]
        var weekId = data.weekId;
        if (group[weekId]) {
            group[weekId] = false;
        }
        else {
            group[weekId] = true;
        }

        var participantDetails = {
            TableName: 'participant',
            Item: participant
        };
    
        await dynamo.put(participantDetails).promise();

        var userDetails = event.requestContext.authorizer.claims;

        var userChange = {
            TableName: 'changelogs',
            Item: {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                event: {
                    user: userDetails,
                    description: `${userDetails.name} set participant ${participant.id} to ${group[weekId]}, in group ${data.groupId} ${weekId}.`
                }
            }
        }

        await dynamo.put(userChange).promise();

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