let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context) => {
    try {

        var group = (await getGroup(event.queryStringParameters.id)).Item;

        var orders = getOrders(group.eventId);

        var participants = [];

        for (var order of orders){
            try {
                if (order.issued_tickets[0].status === 'void') continue;

                createOrUpdateParticipant(order);

                var participant = {
                    groupId,
                    id: order.id,
                    parent_name: order.buyer_details.name,
                    type: order.issued_tickets[0].description,
                    created_at: order.issued_tickets[0].created_at,
                    county: order.buyer_details.custom_questions[0].answer,
                    child_name: order.buyer_details.custom_questions[2].answer,
                    class: order.buyer_details.custom_questions[3].answer,
                    email: order.buyer_details.email,
                    phone: order.buyer_details.phone
                };
                participant = await createOrUpdateParticipant(participant)
                participants.push(participant)
            } catch(e) {
                console.log(e);
            }
        }


        for (var participant of participants){
            var existingParticipantIndex = group.participants.findIndex(r => r.id == participant.id);

            if (existingParticipantIndex === -1)
                group.participants.push(participant);
            else{
                group.participants[existingParticipantIndex] = participant;
            }
        }

        var params = {
            TableName: 'group',
            Item: group
        };

        await dynamo.put(params).promise();

        response = {
            'statusCode': 200,
            'body': JSON.stringify(response),
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

const getOrders = async(eventId) => {
    const ticketTailorSk = await ssm.getParameter({
        Name: process.env.TICKET_TAILOR_SK,
        WithDecryption: true
    }).promise();

    return await axios.get(`https://api.tickettailor.com/v1/orders?event_id=${eventId}&status=completed`, 
            {
                auth:{
                    username: ticketTailorSk.Parameter.Value,
                    password: ""
                }
            }
        );
}

const createOrUpdateParticipant = async (order, groupId) => {

    var participant = await getParticipant(order.id);

    participant.groupId = groupId;

    participant.parent_name = order.buyer_details.name;
    participant.type = order.issued_tickets[0].description;
    participant.created_at = order.issued_tickets[0].created_at;
    participant.county = order.buyer_details.custom_questions[0].answer;
    participant.child_name = order.buyer_details.custom_questions[2].answer;
    participant.class = order.buyer_details.custom_questions[3].answer;
    participant.email = order.buyer_details.email;
    participant.phone = order.buyer_details.phone;

    var params = {
        TableName: 'participant',
        Item: participant
    };

    await dynamo.put(params).promise();

    return participant;
}

const getParticipant = async(participantId) => {
    var participant = null;

    try{
        var params = {
            TableName: 'participant',
            Key: {
                'id': participantId
            }
        };
        participant = await dynamo.get(params).promise();
    } catch(e){
        return null;
    }
  
    return participant
};

const getGroup = async(groupId) => {
    var params = {
        TableName: 'group',
        Key: {
            'id': groupId
        }
    };

    return await dynamo.get(params).promise();
};