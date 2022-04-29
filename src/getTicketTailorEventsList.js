let response;
const AWS = require('aws-sdk');
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator.

        const ticketTailorSk = await ssm.getParameter({
            Name: process.env.TICKET_TAILOR_SK,
            WithDecryption: true
        }).promise();

        var eventsResponse = await axios.get(`https://api.tickettailor.com/v1/events?start_at.gte=${Math.round(new Date().getTime()/1000)}&status=published`, 
            {
                auth:{
                    username: ticketTailorSk.Parameter.Value,
                    password: ""
                }
            }
        );
        
        console.log(eventsResponse.data.data);

        response = {
            'statusCode': 200,
            'body': JSON.stringify(eventsResponse.data.data),
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