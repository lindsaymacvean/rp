let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
            let data = JSON.parse(event.body);

            let participantId = data.participantId;
            console.log('participantId',participantId);
            let participant = (await getParticipant(participantId)).Item;
            console.log('participant',participant);
            let groupId = participant.groupId;
            console.log('groupId', groupId);
            let group = (await getGroup(groupId)).Item;
            console.log('group', group);

            // Delete student
            var removeParticipantParams = {
                TableName: 'participant',
                Key: {
                    'id': participantId
                }
            }
            try {
                await dynamo.delete(removeParticipantParams).promise();
                console.log(`removed participant ${participant.child_name} from participant table`);
            } catch (e) {
                console.log(e);
            }

            // Delete student from group
            var studentIndexToDeleteFromGroup = group.participants.findIndex(r => r.id == participantId);
            console.log('studentIndexToDeleteFromGroup is', studentIndexToDeleteFromGroup);
            if (studentIndexToDeleteFromGroup > -1) {
                let UpdateExpression = 'REMOVE participants['+studentIndexToDeleteFromGroup+']';
                let removeStudentParamsFromGroup = {
                    TableName: 'group',
                    Key: {
                        'id': groupId
                    },
                    UpdateExpression
                }
                try {
                    await dynamo.update(removeStudentParamsFromGroup).promise();
                    console.log(`removed participant ${participantId} from group ${groupId}`);
                } catch (e) {
                    console.log(e);
                }
            }

            response = {
                'statusCode': 200,
                'body': 'Student Deleted',
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

const getParticipant = async(participantId) => {
    var params = {
        TableName: 'participant',
        Key: {
            'id': participantId
        }
    };

    let resp;

    try {
        resp = await dynamo.get(params).promise();
    } catch(e) {
        console.log(e);
    }

    return resp;
};

const getGroup = async(groupId) => {
    var params = {
        TableName: 'group',
        Key: {
            'id': groupId
        }
    };

    let resp;

    try {
        resp = await dynamo.get(params).promise();
    } catch(e) {
        console.log(e);
    }

    return resp;
};