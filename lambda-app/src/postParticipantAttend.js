let response;
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context) => {

    try {

        //TODO: check if current user is Lead Facilitator OR the current facilitator for this group
        if (event.requestContext.authorizer.claims['cognito:groups'].includes('LeadFacilitators')) {
            console.log('user is a lead facilitator');
        } else {
            console.log('user is not a lead facilitator');
        }
        
        var data = JSON.parse(event.body);
        var weekId = data.weekId;
        var present = data.present;
        var reason = data.reason;

        // Get the participant from the participant table
        try {
            var participant = (await getParticipant(data.participantId)).Item;
        } catch {
            console.log(e);
            response = {
                'statusCode': 500,
                'body': "Data not saved",
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            };
            return response; 
        }

        // If participant does not have any attendance record for this week then iniitialise
        participant.attend = participant.attend ?? {};
        participant.attend[data.groupId] = participant.attend[data.groupId] ?? {};
        var group = participant.attend[data.groupId];
        // For backwards compatibility check if group[weekId] is a Bool
        if (typeof group[weekId] === "boolean") {
            console.log('Old attendance record found');
            if (group[weekId]) {
                group[weekId].present = true;
                group[weekId].absent = false;
                group[weekId].reason = "";
            } else {
                group[weekId].present = false;
                group[weekId].absent = true;
                group[weekId].reason = "Reason Not Given";
            }
        }
        group[weekId] = group[weekId] ?? {}; 

        // If particpant present then mark them as such
        if (present) {
            group[weekId].present = true;
            group[weekId].absent = false;
            group[weekId].reason = "";
        }
        else {
            group[weekId].present = false;
            group[weekId].absent = true;
            group[weekId].reason = reason;
        }
        
        try {
            var participantDetails = {
                TableName: 'participant',
                Item: participant
            };
            await dynamo.put(participantDetails).promise();

            // Update Logs Table
            var userDetails = event.requestContext.authorizer.claims;
            var userChange = {
                TableName: 'changelogs',
                Item: {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    event: {
                        user: userDetails,
                        description: `${userDetails.name} set participant ${participant.id} to ${group[weekId]}, in group ${data.groupId} ${weekId}.`
                    }
                }
            }
            await dynamo.put(userChange).promise();

            response = {
                'statusCode': 200,
                'body': JSON.stringify(participant),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        } catch(e) {
            console.log(e);
            response = {
                'statusCode': 500,
                'body': "Data not saved",
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        }
        

    } catch (err) {
        return err;
    }

    return response
};

const getParticipant = async(participantId) => {
    try {
        var params = {
            TableName: 'participant',
            Key: {
                'id': participantId
            }
        };
    
        return await dynamo.get(params).promise();
    } catch(e) {
        console.log(e);
        return;
    }
    
};