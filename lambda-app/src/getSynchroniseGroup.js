let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context) => {
    try {

        var group = (await getGroup(event.queryStringParameters.id)).Item;

        var orders = (await getOrders(group.eventId)).data.data;

        var participants = [];

        for (var order of orders) {
            try {
                if (order.issued_tickets[0].status !== 'valid') {
                    // remove student manually from participants in group table
                    var participantIndexToDelete = group.participants.findIndex(r => r.id == order.id);
                    if (participantIndexToDelete > -1) {
                        group.participants.splice(participantIndexToDelete, 1);
                        var UpdateExpression = 'REMOVE participants['+participantIndexToDelete+']';
                        var removeParticipantParams = {
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

                    var removeParticipantParams2 = {
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
                var participant = await createOrUpdateParticipant(order, group.id);
                participants.push(participant)
            } catch(e) {
                console.log(e);
            }
        }

        if (!group.participants)
            group.participants = [];

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

const findQuestion = (searchString, questions) => {
    console.log(questions);
    let reg = new RegExp(searchString, 'i');
    let answer = {
        answer: null
    }
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
    var participant = (await getParticipant(order.id))?.Item;

    if (!participant || !participant.id ){
        participant = {
            id: order.id,
            groupId
        }
    } 

    participant.parent_name = order.buyer_details.name;
    participant.type = order.issued_tickets[0].description;
    participant.created_at = order.issued_tickets[0].created_at;
    
    let buyerquestions = order.buyer_details.custom_questions;
    let attendeequestions = order.issued_tickets[0].custom_questions;
    participant.county = findQuestion('county', attendeequestions.concat(buyerquestions));
    participant.child_name = findQuestion('name', attendeequestions);
    participant.class = findQuestion('(class|year)', attendeequestions.concat(buyerquestions));
    participant.email = order.buyer_details.email;
    participant.phone = order.buyer_details.phone;

    try {
        let params = {
            TableName: 'participant',
            Item: participant
        };
        await dynamo.put(params).promise();
    } catch {
        console.log(e);
    }
    
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