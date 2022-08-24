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
            TableName: 'facilitator',
            Key: {
                'id': event.queryStringParameters.id
            }
        };

        var body = await dynamo.get(params).promise();

        // Get groups for facilitator
        body.Item.groups = {};
        for (var group in body.Item.groupsIds) {
            var groupId = body.Item.groupsIds[group];
            var groupParams = {
                TableName: 'group',
                Key: {
                    'id': groupId
                }
            };
            groupDetails = await dynamo.get(groupParams).promise();
            if (groupDetails.Item) {
                body.Item.groups[groupId] = groupDetails.Item;
            }
        }

        // Get semester name for each group
        for (const [key, value] of Object.entries(body.Item.groups)) {
            try {
                var semesterId = body.Item.groups[key].semesterId;
                var semesterParams = {
                    TableName: 'semester',
                    Key: {
                        'id': semesterId
                    }
                }
                var semesterDetails = await dynamo.get(semesterParams).promise();
                body.Item.groups[key].semesterName = semesterDetails.Item.name;
            } catch (e) {
                console.log(e);
            }
        }

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