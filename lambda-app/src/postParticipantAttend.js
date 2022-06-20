let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator
        var data = JSON.parse(event.body);

        console.log(data);

        // Get the particpant from the participant table
        var participant = (await getParticipant(data.participantId)).Item;

        participant.attend = participant.attend ?? {};
        participant.attend[data.groupId] = participant.attend[data.groupId] ?? {};

        // If particpant already marked as attending
        if (participant.attend[data.groupId][data.weekId]) {
            participant.attend[data.groupId][data.weekId]= !participant.attend[data.groupId][data.weekId];
        }
        else {
            participant.attend[data.groupId][data.weekId] = true;
        }
            

        var participant = {
            TableName: 'participant',
            Item: participant
        };
    
        await dynamo.put(participant).promise();



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