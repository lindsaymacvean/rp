const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    //TODO: check if current user is Lead Facilitator.
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');
    } else {
        console.log('user is not a lead facilitator');
    }
    //TODO validate data

    var semester = (await getSemester(data.semesterId)).Item;
    var facilitator = (await getFacilitator(data.facilitatorId)).Item;
    //TODO if semester or facilitator is not found return error.

    var group = await createGroup(data);
    await addGroupToSemester(semester, group);
    await addGroupToFacilitator(facilitator, group);

    response = {
        'statusCode': 200,
        'body': JSON.stringify(group),
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    return response;
};

const getSemester = async(semesterId) => {
    var params = {
        TableName: 'semester',
        Key: {
            'id': semesterId
        }
    };

    return await dynamo.get(params).promise();
};

const getFacilitator = async(facilitatorId) => {
    var params = {
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

    var params = {
        TableName: 'group',
        Item: item
    };

    item.participants = await createParticipants(item.id, item.eventId);
    await dynamo.put(params).promise();

    return item;
};

const addGroupToSemester = async(semester, group) => {

    if (!semester.groupsIds)
        semester.groupsIds = [];

    semester.groupsIds.push(group.id);

    var params = {
        TableName: 'semester',
        Item: semester
    };

    await dynamo.put(params).promise();
};

const addGroupToFacilitator = async(facilitator, group) => {

    if (!facilitator.groupsIds)
        facilitator.groupsIds = [];

    facilitator.groupsIds.push(group.id);

    var params = {
        TableName: 'facilitator',
        Item: facilitator
    };

    await dynamo.put(params).promise();
};

const createParticipants = async(groupId, eventId) => {
    const ticketTailorSk = await ssm.getParameter({
        Name: process.env.TICKET_TAILOR_SK,
        WithDecryption: true
    }).promise();

    var ticketsResponse = await axios.get(`https://api.tickettailor.com/v1/orders?event_id=${eventId}&status=completed`, 
            {
                auth:{
                    username: ticketTailorSk.Parameter.Value,
                    password: ""
                }
            }
        );

    var findQuestion = (searchString, questions) => {
        var reg = new RegExp(searchString, 'g');
        var answer = {
            answer: undefined
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
        
        return answer.answer;
    }

    var participants = [];
    for (var order of ticketsResponse.data.data){
        try {
            if (order.issued_tickets[0].status !== 'valid') continue;
            var participant = {
                groupId,
                id: order.id,
                parent_name: order.buyer_details.name,
                type: order.issued_tickets[0].description,
                created_at: order.issued_tickets[0].created_at,
                county: findQuestion('county', order.buyer_details.custom_questions),
                child_name: findQuestion('name', order.buyer_details.custom_questions),
                class: findQuestion('class', order.buyer_details.custom_questions),
                county: order.buyer_details.custom_questions[0].answer,
                child_name: order.buyer_details.custom_questions[2].answer,
                class: order.buyer_details.custom_questions[3].answer,
                email: order.buyer_details.email,
                phone: order.buyer_details.phone
            };
            participants.push(participant)
            await createParticipant(participant)
        } catch(e) {
        }
    }

    return participants;
}

const createParticipant = async (data) => {

    var params = {
        TableName: 'participant',
        Item: data
    };

    await dynamo.put(params).promise();
}