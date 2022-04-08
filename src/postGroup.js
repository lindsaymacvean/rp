const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    //TODO check if current user is Lead Facilitator.
    //TODO validate data

    var semester = (await getSemester(data.semesterId)).Item;
    var facilitator = (await getFacilitator(data.facilitatorId)).Item;
    //TODO if semester or facilitator is not found return error.

    var group = await createGroup(data);
    await addGroupToSemester(semester, group);
    await addGroupToFacilitator(facilitator, group);

    response = {
        'statusCode': 200,
        'body': 'ok',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    return response;
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

const createGroup = async(data) => {
    const item = {
        'name': data.name,
        'dayOfWeek': data.dayOfWeek,
        'time': data.time,
        'dateOfFirstSession': data.dateOfFirstSession,
        'themes': data.themes,
        'facilitatorId': data.facilitatorId,
        'semesterId': data.semesterId,
        'id': crypto.randomUUID()
    }

    var params = {
        TableName: 'group',
        Item: item
    };

    await dynamo.put(params).promise();
    return item;
};

const addGroupToSemester = async(semester, group) => {

    if (!semester.groupsIds)
        semester.groupsIds = [];

    semester.groupsIds.push(group.id);

    var params = {
        TableName: 'semester',
        Item: semester
    };

    await dynamo.put(params).promise();
};

const addGroupToFacilitator = async(facilitator, group) => {

    if (!facilitator.groupsIds)
        facilitator.groupsIds = [];

    facilitator.groupsIds.push(group.id);

    var params = {
        TableName: 'facilitator',
        Item: facilitator
    };

    await dynamo.put(params).promise();
};