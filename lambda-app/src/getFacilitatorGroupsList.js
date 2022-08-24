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
        var facilitator, groups, body = [];

        try {
            var params = {
                TableName: 'facilitator',
                Key: {
                    'id': event.requestContext.authorizer.claims.sub
                }
            };
            var facilitator = await dynamo.get(params).promise();
        } catch(e) {
            console.log(e);
        }

        try {
            var facilitatorGroupsIds = facilitator.Item.groupsIds;
            if (facilitatorGroupsIds && facilitatorGroupsIds.length > 0) {
                var keys = facilitatorGroupsIds.map(r => ({id: r}));
                var params = {
                    "RequestItems" : {
                        "group" : {
                            "Keys" : keys
                        }
                    }
                };

                groups = await dynamo.batchGet(params).promise();
                body = groups.Responses.group;
            }
        } catch(e) {
            console.log(e);
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