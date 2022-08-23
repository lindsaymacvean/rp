let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.  
        // Probably need to check the signature on this claim 
        // to make sure it has not been altered by the frontend
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }

        var group = (await getGroup(event.queryStringParameters.id)).Item;
        var facilitator = (await getFacilitator(group.facilitatorId)).Item;
        var semester = (await getSemester(group.semesterId)).Item;

        group.facilitator = facilitator;
        group.semester = semester;

        response = {
            'statusCode': 200,
            'body': JSON.stringify(group),
            'headers': {
                'Access-Control-Allow-Origin': '*',
            }
        }

    } catch (err) {
        return err;
    }

    return response
};

const getGroup = async(groupId) => {
    var params = {
        TableName: 'group',
        Key: {
            'id': groupId
        }
    };

    return await dynamo.get(params).promise();
};

const getSemester = async(semesterId) => {
    var params = {
        TableName: 'semester',
        Key: {
            'id': semesterId
        }
    };

    return await dynamo.get(params).promise();
};

const getFacilitator = async(facilitatorId) => {
    var params = {
        TableName: 'facilitator',
        Key: {
            'id': facilitatorId
        }
    };

    return await dynamo.get(params).promise();
};