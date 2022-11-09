let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {


    //TODO: check if current user is Lead Facilitator.
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');
    } else {
        console.log('user is not a lead facilitator');
    }

    try {
        // Get all the group ids for a semester
        var semester = (await getSemester(event.queryStringParameters.semesterid)).Item;

        // Loop through the group Ids and get all the participants for each group
        var group;
        var groupsParticipants;
        var body = {
            counties: {},
            attendance: {},
            absence: {},
            absenceReasons: [],
            count: 0,
            noshows: 0
        };
        for (let groupId of semester.groupsIds) {
            // Get participants for each group
            group = await getGroup(groupId)
            group.forEach(participant => {
                // For each participant check their county and add it to a dictionary
                if (participant.county) {
                    if (body.counties[participant.county]) {
                        body.counties[participant.county] += 1;
                    } else {
                        body.counties[participant.county] = 1;
                    }
                }
            });

            // Get participant details from participant table
            groupsParticipants = await getParticipants(groupId);
            // Loop through participants and get attendance
            groupsParticipants.forEach(participant => {
                body.count += 1;
                if (!participant.attend || Object.keys(participant.attend).length === 0) {
                    body.noshows += 1;
                    body.count -= 1;
                } else {
                    for (const [group, attend] of Object.entries(participant.attend)) {
                        if (!attend || Object.keys(attend).length === 0) {
                            body.noshows += 1;
                            body.count -= 1;
                        } else {
                            let absentWeek = 0;
                            // For each student check their attendance record
                            for (const [week, value] of Object.entries(attend)) {
                                // For each week in that group attendance
                                if (value) {
                                    if (value.absent) {
                                        absentWeek += 1;
                                        body.absence[week] = body.absence[week] ?? {};
                                        body.absence[week][value.reason] = body.absence[week][value.reason] ?? 0;
                                        body.absence[week][value.reason] += 1;

                                        if (!body.absenceReasons.includes(value.reason)) {
                                            body.absenceReasons.push(value.reason);
                                        }
                                    } else {
                                        if (body.attendance[week]) {
                                            body.attendance[week] += 1;
                                        } else {
                                            body.attendance[week] = 1;
                                        }
                                    }
                                }
                                // If absent all 6 weeks then noshow
                                if (absentWeek === 6) {
                                    body.noshows += 1;
                                    body.count -= 1;
                                }
                            }
                        }
                    }
                }
            });
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

    return response;



    // for (key in semesterkeys) {
    //     var params = {
    //         TableName: 'participant',
    //         IndexName: "gsiParticipantEventTable",
    //         KeyConditionExpression: "groupId = :semesterid",
    //         ExpressionAttributeValues: {
    //             ":semesterid": event.queryStringParameters.semesterid
    //         }
    //       };

    //       var body = await dynamo.query(params).promise();

    // }

};

const getSemester = async (semesterId) => {
    var params = {
        TableName: 'semester',
        Key: {
            'id': semesterId
        }
    };

    return await dynamo.get(params).promise();
};

const getGroup = async (groupId) => {
    var params = {
        TableName: 'group',
        Key: {
            'id': groupId
        }
    };
    var group = await dynamo.get(params).promise()
    if (group.Item) {
        return group.Item.participants
    } else {
        return [];
    }
}

const getParticipants = async (groupId) => {
    var params = {
        TableName: 'participant',
        IndexName: "gsiParticipantEventTable",
        KeyConditionExpression: "groupId = :id",
        ExpressionAttributeValues: {
            ":id": groupId
        }
    };

    participantDetails = await dynamo.query(params).promise();
    return participantDetails.Items;
}