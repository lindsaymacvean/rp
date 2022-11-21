const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");
const axios = require('axios');
const ssm = new AWS.SSM();

exports.handler = async(event, context, callback) => {

    let data = JSON.parse(event.body);

    console.log(data);

    if (!validateSignature(event)) {
        console.log('Signature was invalid');
        return {
            'statusCode': 403,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }

    if (data.event === 'Issued ticket' || data.event === 'ISSUED_TICKET.CREATED'){
        let group = (await getGroupByEventId(data.payload.event_id)).Items[0];
        if (!group){
            console.log('That group has not been created in RP.');
            return {
                'statusCode': 200,
                'body': 'ok',
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            };
        }

        let orders = (await getOrders(group.eventId)).data.data;

        let participants = [];

        for (let order of orders){
            try {
                if (order.issued_tickets[0].status !== 'valid') {
                    // remove student manually from participants in group table
                    let participantIndexToDelete = group.participants.findIndex(r => r.id == order.id);
                    if (participantIndexToDelete > -1) {
                        group.participants.splice(participantIndexToDelete, 1);
                        let UpdateExpression = 'REMOVE participants['+participantIndexToDelete+']';
                        let removeParticipantParams = {
                            TableName: 'group',
                            Key: {
                                'id': event.queryStringParameters.id
                            },
                            UpdateExpression
                        }
                        try {
                            dynamo.update(removeParticipantParams).promise();
                            console.log('removed from participants in group');
                        } catch (e) {
                            console.log(e);
                        }
                    }

                    let removeParticipantParams2 = {
                        TableName: 'participant',
                        Key: {
                            'id': order.id
                        }
                    }
                    try {
                        dynamo.delete(removeParticipantParams2).promise();
                        console.log('removed from participants table');
                    } catch (e) {
                        console.log(e);
                    }
                    continue;
                }
                let participant = await createOrUpdateParticipant(order, group.id);
                participants.push(participant)
            } catch(e) {
                console.log(e);
            }
        }

        if (!group.participants)
            group.participants = [];

        for (let participant of participants){
            let existingParticipantIndex = group.participants.findIndex(r => r.id == participant.id);

            if (existingParticipantIndex === -1)
                group.participants.push(participant);
            else{
                group.participants[existingParticipantIndex] = participant;
            }
        }

        let params = {
            TableName: 'group',
            Item: group
        };

        await dynamo.put(params).promise();    
    }

    /**
     * ORDER.CREATED is the data.event seen on a webhook 16th Nov 2022 (they might be changing their webhook event types)
     */

    if (data.event === 'ORDER.CREATED'){
        let group = (await getGroupByEventId(data.payload.event_summary.id)).Items[0];
        if (!group){
            console.log('That group has not been created in RP.');
            return {
                'statusCode': 200,
                'body': 'ok',
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            };
        }

        if (!group.participants) group.participants = [];
    
        let participant = await createOrUpdateParticipant(data.payload, group.id);

        let existingParticipantIndex = group.participants.findIndex(r => r.id == participant.id);

        if (existingParticipantIndex === -1)
            group.participants.push(participant);
        else{
            group.participants[existingParticipantIndex] = participant;
        }

        let params = {
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
    let params = {
        TableName: 'group',
        IndexName: "gsiGroupEventTable",
        KeyConditionExpression: "eventId = :eventId",
        ExpressionAttributeValues: {
            ":eventId": eventId
        },
    };

    let group;

    try {
        group = await dynamo.query(params).promise();
    } catch(e) {
        console.log(e);
    }

    return group;
};

/**
 * getOrders is only needed for the Issued Ticket type of webhook (which we probably don't need any more)
 * 
 * @param {String} eventId 
 * @returns promise of response from ticket tailor
 */
const getOrders = async(eventId) => {
    let ticketTailorSk;
    try {
        ticketTailorSk = await ssm.getParameter({
            Name: process.env.TICKET_TAILOR_SK,
            WithDecryption: true
        }).promise();
    } catch(e) {
        console.log(e);
    }

    let orders;
    try {
        orders = await axios.get(`https://api.tickettailor.com/v1/orders?event_id=${eventId}&status=completed`, 
            {
                auth:{
                    username: ticketTailorSk.Parameter.Value,
                    password: ""
                }
            }
        );
    } catch(e) {
        console.log(e);
    }

    return orders;
}

const findQuestion = (searchString, questions) => {
    let reg = new RegExp(searchString, 'i');
    let answer = {
        answer:undefined
    };
    try {
        answer = questions.find(o => {  
            if (typeof o === 'object') {
                for (p of Object.values(o)) {    
                    if (reg.test(p)) return true; 
                }
            }  
        });
    } catch (e) {
        console.log(e);
    }
    if (!answer || !answer.answer) {
        return null;
    } else {
        return answer.answer;
    }
}

const createOrUpdateParticipant = async (order, groupId) => {
    if (!order || !order.id) return false;
    if (!groupId) return false;
    let participant = (await getParticipant(order.id))?.Item;

    if (!participant || !participant.id ){
        participant = {
            id: order.id,
            groupId
        }
    } 

    participant.parent_name = order.buyer_details.name;
    participant.type = order.issued_tickets[0].description;
    participant.created_at = order.issued_tickets[0].created_at;

    // let questions = order.buyer_details.custom_questions;
    let questions = order.issued_tickets[0].custom_questions;
    participant.county = findQuestion('county', questions);
    participant.child_name = findQuestion('name', questions);
    participant.class = findQuestion('class', questions);
    participant.email = order.buyer_details.email;
    participant.phone = order.buyer_details.phone;

    console.log('participant', participant);
    
    try {
        let params = {
            TableName: 'participant',
            Item: participant
        };
        await dynamo.put(params).promise();
    } catch(e) {
        console.log(e);
    }
    return participant;
}

const getParticipant = async(participantId) => {
    let participant;
    try{
        let params = {
            TableName: 'participant',
            Key: {
                'id': participantId
            }
        };
        participant = await dynamo.get(params).promise();
    } catch(e){
        console.log(e);
    }
    return participant
};

const validateSignature = async(event) => {
    const ticketTailorWebhookSk = await ssm.getParameter({
        Name: process.env.TICKET_TAILOR_WEBHOOK_SK,
        WithDecryption: true
    }).promise();

    headerParts = event.headers['tickettailor-webhook-signature'].split(',')
    timestamp = headerParts[0].split('=')[1]
    signature = headerParts[1].split('=')[1]

    let hash = crypto.createHmac('sha256', ticketTailorWebhookSk.Parameter.Value).update(timestamp + event.body).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))){
        // Authenticate request is from ticket Tailor and correct account
        console.log('The signature was not correct so 403.')
        return false;
    }

    return true;
}