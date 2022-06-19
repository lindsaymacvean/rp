let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO check if current user is Lead Facilitator.

        var params = {
            TableName: 'semester',
            Key: {
                'id': event.queryStringParameters.semesterId
            }
        };

        var body = await dynamo.get(params).promise();

        var semesterGroupsIds = body.Item.groupsIds;
        var keys = semesterGroupsIds.map(r => ({ id: r }));

        var params = {
            "RequestItems": {
                "group": {
                    "Keys": keys
                }
            }
        };

        var groups = await dynamo.batchGet(params).promise();

        // TODO: get the facilitator name and email from facilitator table


        response = {
            'statusCode': 200,
            'body': JSON.stringify(groups.Responses.group),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
};