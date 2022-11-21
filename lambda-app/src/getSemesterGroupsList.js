let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {
    let semesterId = event.queryStringParameters.semesterId;
    if (!semesterId) {
        return {
            'statusCode': 500,
            'body': 'The request had no semesterId',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }

        var params = {
            TableName: "semester",
            Key: {
                "id": semesterId
            }
        };

        var body = {
            groups: {},
            facilitators: []
        }
        
        var semesters = await dynamo.get(params).promise();
        var semesterGroupsIds = semesters.Item.groupsIds;
        var keys = semesterGroupsIds.map(r => ({ id: r }));

        var groupsParams = {
            "RequestItems": {
                "group": {
                    "Keys": keys
                }
            }
        };

        var groupsFromDB = await dynamo.batchGet(groupsParams).promise();
        var groupsWithFacilitatorNames = [];

        // Get the facilitator name and email from facilitator table
        for (let group of groupsFromDB.Responses.group) {
            var facilitatorParams = {
                TableName: "facilitator",
                Key: {
                    "id": group.facilitatorId
                }
            };
            // TODO: this is inefficient and causes a long delay when calling this endpoint
            // Try altering the db so that the facilitator name is stored in the group itself??
            var facilitator = await dynamo.get(facilitatorParams).promise();
            group.facilitatorname = facilitator.Item.name;
            groupsWithFacilitatorNames = groupsWithFacilitatorNames.concat(group);
        }

        body.groups = groupsWithFacilitatorNames;

        response = {
            'statusCode': 200,
            'body': JSON.stringify(body),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        response = {
            'statusCode': 500,
            'body': 'There was an error looking for that group list.',
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }
    }

    return response
};