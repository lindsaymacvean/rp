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

    headerParts = event.headers['TicketTailor-Webhook-Signature'].split(',')
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

    if (data.event === "Issued ticket"){
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
    
        var existingParticipant = group.participants.findIndex(r => r.id == data.payload.id);

        if (!existingParticipant)
            group.participants.push(data.payload);
        else
            group.participants.push(data.payload);

        var params = {
            TableName: 'group',
            Item: group
        };

        await dynamo.put(params).promise();
        await createParitcipant(data.payload);
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

const createParitcipant = async (data) => {

    var params = {
        TableName: 'participant',
        Item: data
    };

    await dynamo.put(params).promise();
}