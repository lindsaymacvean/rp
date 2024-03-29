let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
            let data = JSON.parse(event.body);

            let group = (await getGroup(data.groupId)).Item;
            let semester = (await getSemester(group.semesterId)).Item;
            let facilitator = (await getFacilitator(group.facilitatorId)).Item;

            // Delete students associated with group
            for (let participant of group.participants) {
                let removeParticipantParams = {
                    TableName: 'participant',
                    Key: {
                        'id': participant.id
                    }
                }
                try {
                    await dynamo.delete(removeParticipantParams).promise();
                    console.log(`removed participant ${participant.child_name} from participant table`);
                } catch (e) {
                    console.log(e);
                }
            }

            // Delete group from semester
            var groupIndexToDelete = semester.groupsIds.findIndex(r => r == data.groupId);
            console.log(groupIndexToDelete);
            if (groupIndexToDelete > -1) {
                semester.groupsIds.splice(groupIndexToDelete, 1);
                let UpdateExpression = 'REMOVE groupsIds['+groupIndexToDelete+']';
                let removeGroupParams = {
                    TableName: 'semester',
                    Key: {
                        'id': semester.id
                    },
                    UpdateExpression
                }
                try {
                    await dynamo.update(removeGroupParams).promise();
                    console.log(`removed ${data.groupId} from semester in semesters table`);
                } catch (e) {
                    console.log(e);
                }
            }

            // Delete group from facilitator
            let groupIndexToDeleteFromFacilitator = facilitator.groupsIds.findIndex(r => r == data.groupId);
            console.log(groupIndexToDeleteFromFacilitator);
            if (groupIndexToDeleteFromFacilitator > -1) {
                facilitator.groupsIds.splice(groupIndexToDeleteFromFacilitator, 1);
                let UpdateExpression = 'REMOVE groupsIds['+groupIndexToDeleteFromFacilitator+']';
                let removeGroupParamsFromFacilitator = {
                    TableName: 'facilitator',
                    Key: {
                        'id': facilitator.id
                    },
                    UpdateExpression
                }
                try {
                    await dynamo.update(removeGroupParamsFromFacilitator).promise();
                    console.log(`removed ${data.groupId} from facilitator in facilitators table`);
                } catch (e) {
                    console.log(e);
                }
            }

            // Delete group
            let removeGroupParams = {
                TableName: 'group',
                Key: {
                    'id': data.groupId
                }
            }
            try {
                await dynamo.delete(removeGroupParams).promise();
                console.log(`removed ${group.name} from group table`);
            } catch (e) {
                console.log(e);
            }

            response = {
                'statusCode': 200,
                'body': 'Group Deleted',
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

const getGroup = async(groupId) => {
    let params = {
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

const getSemester = async(semesterId) => {
    let params = {
        TableName: 'semester',
        Key: {
            'id': semesterId
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

const getFacilitator = async(facilitatorId) => {
    let params = {
        TableName: 'facilitator',
        Key: {
            'id': facilitatorId
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