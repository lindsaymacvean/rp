const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {
    let response;
    try {
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            let facilitatorId = event.queryStringParameters.id;

            let updateParams = {
                TableName: 'facilitator',
                Key: {
                    'id': facilitatorId
                },
                UpdateExpression: "set facilitatorEnabled = :falseValue",
                ExpressionAttributeValues: {
                    ":falseValue": false
                }
            };

            await dynamo.update(updateParams).promise();
            response = {
                'statusCode': 200,
                'body': 'Facilitator Disabled',
                'headers': {
                    'Access-Control-Allow-Origin': '*'
                }
            };
        } else {
            response = {
                'statusCode': 403,
                'body': 'user is not a lead facilitator',
                'headers': {
                    'Access-Control-Allow-Origin': '*'
                }
            };
        }
    } catch (err) {
        return err;
    }
    return response;
};
