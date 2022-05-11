const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    console.log(data);

    const ticketTailorWebhookSk = await ssm.getParameter({
        Name: process.env.TICKET_TAILOR_WEBHOOK_SK,
        WithDecryption: true
    }).promise();

    headerParts = event.headers['tickettailor-webhook-signature'].split(',')
    timestamp = headerParts[0].split('=')[1]
    signature = headerParts[1].split('=')[1]

    let hash = crypto.createHmac('sha256', ticketTailorWebhookSk.Parameter.Value).update(timestamp + event.body).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))){
        return {
            'statusCode': 403,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        };
    }

    if (data.event === 'ORDER.CREATED'){
        var group = (await getGroupByEventId(data.payload.event_id)).Items[0];
        
        console.log(group);

        if (!group){
            return {
                'statusCode': 200,
                'body': 'ok',
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            };
        }

        if (!group.participants)
            group.participants = [];
    
        var participant = await createOrUpdateParticipant(data.payload, group.id);

        var existingParticipantIndex = group.participants.findIndex(r => r.id == participant.id);

        if (existingParticipantIndex === -1)
            group.participants.push(participant);
        else{
            group.participants[existingParticipantIndex] = participant;
        }

        var params = {
            TableName: 'group',
            Item: group
        };

        await dynamo.put(params).promise();

    }

    response = {
        'statusCode': 200,
        'body': 'ok',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    return response;
};

const getGroupByEventId = async(eventId) => {
    var params = {
        TableName: 'group',
        IndexName: "gsiGroupEventTable",
        KeyConditionExpression: "eventId = :eventId",
        ExpressionAttributeValues: {
            ":eventId": eventId
        },
    };

    return await dynamo.query(params).promise();
};

const createOrUpdateParticipant = async (payload, groupId) => {

    var participant = await getParticipant(payload.id);

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