const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");
const axios = require('axios');
const ssm = new AWS.SSM();

exports.handler = async(event, context, callback) => {

    const data = JSON.parse(event.body);
    //TODO validate data

    let response;
    try {
        let semester = (await getSemester(data.semesterId)).Item;
        let facilitator = (await getFacilitator(data.facilitatorId)).Item;
        //TODO if semester or facilitator is not found return error.

        let group = await createGroup(data);
        await addGroupToSemester(semester, group);
        await addGroupToFacilitator(facilitator, group);

        response = {
            'statusCode': 200,
            'body': JSON.stringify(group),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    } catch(e) {
        console.log(e);
        response = {
            'statusCode': 500,
            'body': JSON.stringify(e),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }
    
    return response;
};

const getSemester = async(semesterId) => {
    const params = {
        TableName: 'semester',
        Key: {
            'id': semesterId
        }
    };

    return await dynamo.get(params).promise();
};

const getFacilitator = async(facilitatorId) => {
    const params = {
        TableName: 'facilitator',
        Key: {
            'id': facilitatorId
        }
    };
    return await dynamo.get(params).promise();
};

const createGroup = async(data) => {
    const item = {
        'name': data.name,
        'dayOfWeek': data.dayOfWeek,
        'time': data.time,
        'dateOfFirstSession': data.dateOfFirstSession,
        'themes': data.themes,
        'studentYear': data.studentYear,
        'facilitatorId': data.facilitatorId,
        'semesterId': data.semesterId,
        'eventId': data.eventId,
        'id': crypto.randomUUID()
    }
    item.participants = await createParticipants(item.id, item.eventId);

    const params = {
        TableName: 'group',
        Item: item
    };

    try {
        await dynamo.put(params).promise();
    } catch(e) {
        console.log(e);
    }

    return item;
};

const addGroupToSemester = async(semester, group) => {

    if (!semester.groupsIds)
        semester.groupsIds = [];

    semester.groupsIds.push(group.id);

    const params = {
        TableName: 'semester',
        Item: semester
    };

    await dynamo.put(params).promise();
};

const addGroupToFacilitator = async(facilitator, group) => {
    if (!facilitator.groupsIds)
        facilitator.groupsIds = [];
    facilitator.groupsIds.push(group.id);
    const params = {
        TableName: 'facilitator',
        Item: facilitator
    };
    try {
        await dynamo.put(params).promise();
    } catch(e) {
        console.log(e);
    }
};

const createParticipants = async(groupId, eventId) => {
    let ticketsResponse = await getOrders(eventId);

    let participants = [];
    for (let order of ticketsResponse){
        try {
            if (order.issued_tickets[0].status !== 'valid') continue;
            
            let buyerquestions = order.buyer_details.custom_questions;
            let attendeequestions = order.issued_tickets[0].custom_questions;
            let participant = {
                groupId,
                id: order.id,
                parent_name: order.buyer_details.name,
                type: order.issued_tickets[0].description,
                created_at: order.issued_tickets[0].created_at,
                county: findQuestion('county', attendeequestions.concat(buyerquestions)),
                child_name: findQuestion('name', attendeequestions),
                class: findQuestion('(class|year)', attendeequestions.concat(buyerquestions)),
                email: order.buyer_details.email,
                phone: order.buyer_details.phone
            };
            participants.push(participant)
            await createParticipant(participant)
        } catch(e) {
            console.log(e);
        }
    }

    return participants;
}

const createParticipant = async (data) => {
    const params = {
        TableName: 'participant',
        Item: data
    };

    try {
        await dynamo.put(params).promise();
    } catch(e) {
        console.log(e);
    }
}

const getOrders = async(eventId) => {
    const ticketTailorSk = await ssm.getParameter({
        Name: process.env.TICKET_TAILOR_SK,
        WithDecryption: true
    }).promise();

    let response;

    try {
        response = await axios.get(`https://api.tickettailor.com/v1/orders?event_id=${eventId}&status=completed`, 
        {
            auth:{
                username: ticketTailorSk.Parameter.Value,
                password: ""
            }
        });
        console.log(response);
        return response.data.data
    } catch(e) {
        console.log(e);
        return [];
    }

}

const findQuestion = (searchString, questions) => {
    let reg = new RegExp(searchString, 'i');
    let answer = {
        answer: null
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