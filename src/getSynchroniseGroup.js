let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context) => {

    try {

        var group = (await getGroup(event.queryStringParameters.id)).Item;

        // get db participants
        var dbParticipants = group.participants.L
        
        // get ticket tailor participants
        var ttId = group.event_id;
        var ttParticipants = (await getParticipants(ttId)).Item;

        let response = {};
        response.db = dbParticipants;
        response.tt = ttParticipants;
        

        //compare
        //add any missing participants to db

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

const getGroup = async(groupId) => {
    var params = {
        TableName: 'group',
        Key: {
            'id': groupId
        }
    };

    return await dynamo.get(params).promise();
};

const getParticipants = async(eventId) => {
    const ticketTailorSk = await ssm.getParameter({
        Name: process.env.TICKET_TAILOR_SK,
        WithDecryption: true
    }).promise();

    var tiketsResponse = await axios.get(`https://api.tickettailor.com/v1/issued_tickets?event_id=${eventId}&status=valid`, 
            {
                auth:{
                    username: ticketTailorSk.Parameter.Value,
                    password: ""
                }
            }
        );

    return tiketsResponse.data.data;
}

const createParticipant = async (data) => {

    var params = {
        TableName: 'participant',
        Item: data
    };

    await dynamo.put(params).promise();
}