let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator.
        
        var params = {
            TableName: 'facilitator',
            Key: {
                'id': event.queryStringParameters.facilitatorId
            }
        };

        var body = await dynamo.get(params).promise();

        var facilitatorGroupsIds = body.Item.groupsIds;
        var keys = facilitatorGroupsIds.map(r => ({id: r}));

        var params = {
            "RequestItems" : {
                "group" : {
                    "Keys" : keys
                }
            }
        };

        var groups = await dynamo.batchGet(params).promise();

        response = {
            'statusCode': 200,
            'body': JSON.stringify(groups),
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