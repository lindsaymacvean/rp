let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {
  
  try {
    
    
    //TODO check if current user is Facilitator for group

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
    console.log(err);
    return err;
  }
  
  return response
};