let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {
        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            
            var data = JSON.parse(event.body)
            var semester = (await getSemester(data.semesterId)).Item;

            // delete each group
            for (let group in semester.groupsIds) {
                await deleteGroup(group, semester);
            }

            // delete semester
            var removeSemesterParams = {
                TableName: 'group',
                Key: {
                    'id': data.semesterId
                }
            }
            try {
                await dynamo.delete(removeSemesterParams).promise();
                console.log(`removed semester ${semester.name} from semesters table`);
            } catch (e) {
                console.log(e);
            }

            response = {
                'statusCode': 200,
                'body': 'Semester Deleted',
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

const deleteGroup = async(groupId, semester) => {

            var group = (await getGroup(groupId)).Item;
            var facilitator = (await getFacilitator(group.facilitatorId)).Item;

            // Delete students associated with group
            for (let participant of group.participants) {
                
                var removeParticipantParams = {
                    TableName: 'participant',
                    Key: {
                        'id': participant.id
                    }
                }
                try {
                    await dynamo.delete(removeParticipantParams).promise();
                    console.log(`removed from participant ${participant.child_name} from participant table`);
                } catch (e) {
                    console.log(e);
                }
            }

            // Delete group from semester
            var groupIndexToDelete = semester.groupsIds.findIndex(r => r == groupId);
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
                    console.log(`removed ${groupId} from semester in semesters table`);
                } catch (e) {
                    console.log(e);
                }
            }

            // Delete group from facilitator
            var groupIndexToDeleteFromFacilitator = facilitator.groupsIds.findIndex(r => r == groupId);
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
                    console.log(`removed ${groupId} from facilitator in facilitators table`);
                } catch (e) {
                    console.log(e);
                }
            }

            // Delete group
            var removeGroupParams = {
                TableName: 'group',
                Key: {
                    'id': groupId
                }
            }
            try {
                await dynamo.delete(removeGroupParams).promise();
                console.log(`removed group ${group.name} from group table`);
            } catch (e) {
                console.log(e);
            }
}