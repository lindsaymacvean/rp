let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator.
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }
        
        // Get the group from the group table
        var data = JSON.parse(event.body);
        // Update the facilitator before updating the Group
        // Because UpdateFacilitator checks the group to find the current facilitator
        await removeOldFacilitator(data);
        await addNewFacilitator(data);
        await updateGroup(data);
        await updateLogs(event, data);

        response = {
            'statusCode': 200,
            'body': 'ok',
            'headers': {
                'Access-Control-Allow-Origin': '*'
            }
        }
    } catch (err) {
        return err;
    }
    return response
};

const updateGroup = async(data) => {

    var UpdateExpression = 'set facilitatorId = :facilitatorId';
    var ExpressionAttributeValues = {
        ':facilitatorId': data.facilitatorId
    }

    var params = {
        TableName: 'group',
        Key: {
            'id': data.id
        },
        UpdateExpression,
        ExpressionAttributeValues
    };
    await dynamo.update(params).promise();

};

const removeOldFacilitator = async(data) => {
    // Get the old facilitatorId
    var groupParams = {
        TableName: 'group',
        Key: {
            'id': data.id
        }
    }
    var group = await dynamo.get(groupParams).promise();
    var oldFacilitatorId = group.Item.facilitatorId;

    // Get the list of groups associated with the old facilitator
    var facilitatorParams = {
        TableName: 'facilitator',
        Key: {
            'id': oldFacilitatorId
        }
    }
    var facilitator = await dynamo.get(facilitatorParams).promise();

    // Check if groupsIds exists and has elements
    if (!facilitator.Item.groupsIds || facilitator.Item.groupsIds.length === 0) {
        console.log('No groups to remove for this facilitator.');
        return;
    }

    var groupList = facilitator.Item.groupsIds;

    // Remove the group from the list of groups associated with the old facilitator
    var groupIndex = groupList.findIndex(i => i === data.id);

    // If the group isn't found in the facilitator's list, exit the function
    if (groupIndex === -1) {
        console.log('Group not found in facilitator groups list.');
        return;
    }
    
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html
    var UpdateExpression = 'REMOVE groupsIds['+groupIndex+']';
    var removeGroupParams = {
        TableName: 'facilitator',
        Key: {
            'id': oldFacilitatorId
        },
        UpdateExpression
    }

    try {
        await dynamo.update(removeGroupParams).promise();
    } catch (e) {
        console.log(e);
    }
}

const addNewFacilitator = async(data) => {
    // Add group to new facilitator

    // This checks if groupsIds exists and appends to it, 
    // otherwise it initializes the list with the new group ID.
    var UpdateExpression = 'SET #ri = list_append(if_not_exists(#ri, :emptyList), :vals)';

    var ExpressionAttributeNames = {
        '#ri': 'groupsIds'
    };
    var ExpressionAttributeValues = {
        ':vals': [data.id],  // This will be appended to the existing list, or become the new list
        ':emptyList': []     // An empty list to initialize groupsIds if it doesn't exist
    };
    
    var addGroupParams = {
        TableName: 'facilitator',
        Key: {
            'id': data.facilitatorId
        },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues
    }

    try {
        await dynamo.update(addGroupParams).promise();
    } catch (e) {
        console.log(e);
    }
}

const updateLogs = async(event, data) => {
    var userDetails = event.requestContext.authorizer.claims;
    var facilitatorChange = {
        TableName: 'changelogs',
        Item: {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            event: {
                user: userDetails,
                description: `${userDetails.name} set facilitator for group ${data.id} to facilitatorId ${data.facilitatorId}.`
            }
        }
    }
    await dynamo.put(facilitatorChange).promise();
}