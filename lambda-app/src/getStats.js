let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

    // Regex to match 3rd or 4th Class
    const classMatch = new RegExp("(3rd|4th)", "gi");

    //TODO: check if current user is Lead Facilitator.
    if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
        console.log('user is a lead facilitator');
    } else {
        console.log('user is not a lead facilitator');
    }

    try {
        // Get all the group ids for a semester
        let semester = (await getSemester(event.queryStringParameters.semesterid)).Item;

        // Loop through the group Ids and get all the participants for each group
        let group;
        let groupsParticipants;
        let body = {
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
            let studentYear = group.studentYear;
            let is3rd4th = classMatch.test(studentYear);
            group.participants.forEach(participant => {
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
                            let weeksAbsent = Object.entries(attend).length;
                            // For each student check their attendance record
                            for (const [week, value] of Object.entries(attend)) {
                                // For groups that are 3rd & 4th class dont count week 7 or 8
                                // if (is3rd4th && (week == "week7" || week == "week8")) {
                                //     console.log(`Didnt count week ${week} for ${participant.child_name} because they were in 3rd or 4th class`);
                                //     continue;
                                // }
                                // We could do this instead by not counting entries that are marked as 'not applicable'
                                // For each week in that group attendance
                                if (value) {
                                    if (value.absent) {
                                        weeksAbsent -= 1;
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
                                // If absent or no entry all 6 weeks then noshow
                                if (weeksAbsent === 0) {
                                    console.log(participant);
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
        return group.Item
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