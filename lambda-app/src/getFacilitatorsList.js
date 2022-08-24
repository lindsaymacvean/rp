let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        var params = {
            TableName: 'facilitator',
        };

        //TODO: check if current user is Lead Facilitator.  
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }

        var facilitators = await dynamo.scan(params).promise();

        response = {
            'statusCode': 200,
            'body': JSON.stringify(facilitators),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
};