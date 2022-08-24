let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {
  
  try {
    
    
    //TODO: check if current user is Lead Facilitator.
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');
    } else {
        console.log('user is not a lead facilitator');
    }

    var params = {
      TableName: 'participant',
      IndexName: "gsiParticipantEventTable",
      KeyConditionExpression: "groupId = :id",
      ExpressionAttributeValues: {
          ":id": event.queryStringParameters.id
      }
    };
    
    var body = await dynamo.query(params).promise();
    
    response = {
      'statusCode': 200,
      'body': JSON.stringify(body),
      'headers': {
        'Access-Control-Allow-Origin': '*',
      }
    }
    
  } catch (err) {
    return err;
  }
  
  return response
};