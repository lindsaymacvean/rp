let response;
const AWS = require('aws-sdk');
const axios = require('axios');
var ssm = new AWS.SSM();

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }

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

        response = {
            'statusCode': 200,
            'body': JSON.stringify(eventsResponse.data.data),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
};