let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            
            let data = JSON.parse(event.body)
            let semester = (await getSemester(data.semesterId)).Item;
            console.log('Deleting semester', semester);

            // delete each group
            if (semester && Array.isArray(semester.groupsIds) && semester.groupsIds.length > 0) {
                for (let groupId of semester.groupsIds) {
                    await deleteGroup(groupId, semester);
                    console.log(`Group ${groupId} deleted.`);
                }
            } else {
                console.log('No groups associated with this semester or semester is undefined.');
            }

            // delete semester
            let removeSemesterParams = {
                TableName: 'semester',
                Key: {
                    'id': data.semesterId
                }
            }
            try {
                await dynamo.delete(removeSemesterParams).promise();
                console.log(`removed ${semester.name} from semesters table`);
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
        console.log(err);
        response = {
            'statusCode': 501,
            'body': 'There was a problem with the request.',
            'headers': {
                'Access-Control-Allow-Origin': '*'
            }
        }
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
    console.log('PARAMs', params);
    let resp;
    try {
        resp = await dynamo.get(params).promise();
    } catch (e) {
        console.log(e);
    }

    return resp;
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

            let group = (await getGroup(groupId)).Item;
            let facilitator = (await getFacilitator(group.facilitatorId)).Item;

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