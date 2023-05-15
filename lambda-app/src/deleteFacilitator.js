let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
            let facilitatorId = event.queryStringParameters.id;

            // Delete facilitator
            let removeFacilitatorParams = {
                TableName: 'facilitator',
                Key: {
                    'id': facilitatorId
                }
            }
            try {
                await dynamo.delete(removeFacilitatorParams).promise();
                console.log(`removed ${facilitatorId} from participant table`);
            } catch (e) {
                console.log(e);
            }

            response = {
                'statusCode': 200,
                'body': 'Facilitator Deleted',
                'headers': {
                    'Access-Control-Allow-Origin': '*'
                }
            }

        } else {
            response = {
                'statusCode': 403,
                'body': 'user is not a lead facilitator',
                'headers': {
                    'Access-Control-Allow-Origin': '*'
                }
            }
        }

        

    } catch (err) {
        return err;
    }

    return response
};