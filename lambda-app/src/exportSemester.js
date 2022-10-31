// Did not need these dependencies from the CSVWriterLayer but keeping for reference
// const path = require('path');
// const csvWriter = require('csv-writer');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async(event, context, callback) => {

  let csvRows = ['"id","child_name","groupName","facilitatorname","email","phone","parent_first_name", "parent_last_name", "parent_name", "dayOfWeek", "time", "county", "studentYear", "themes",  "dateOfFirstSession", "eventId", "facilitatorId", "folderId", "created_at", "type"'];

  try {
    // Get all the group ids for the semester
    let semester = await getSemester(event.queryStringParameters.semesterid);

    for (let groupId of semester.groupsIds) {
      // Get each group
      let group = await getGroup(groupId);

      // Get Facilitator name
      // TODO: this is inefficient and causes a long delay when calling this endpoint
      // Try altering the db so that the facilitator name is stored in the group itself??
      var facilitatorParams = {
        TableName: "facilitator",
        Key: {
            "id": group.facilitatorId
        }
      };
      let facilitator = await dynamo.get(facilitatorParams).promise();

      let facilitatorname = facilitator.Item.name;
      let dateOfFirstSession = group.dateOfFirstSession;
      let dayOfWeek = group.dayOfWeek;
      let eventId = group.eventId;
      let facilitatorId = group.facilitatorId;
      let folderId = group.folderId;
      let groupName = group.name;
      let studentYear = group.studentYear;
      let themes = group.themes;
      let time = group.time;

      // Get participant details from participant table
      let groupsParticipants = await getParticipants(groupId);
      // Loop through participants and get county AND attendance
      groupsParticipants.forEach(participant => {

          var id = participant.id;
          var child_name = participant.child_name;
          var county = participant.county;
          var created_at = participant.created_at;
          var email = participant.email;
          var parent_first_name = participant.parent_first_name;
          var parent_last_name = participant.parent_last_name;
          var parent_name = participant.parent_name;
          var phone = participant.phone;
          var type = participant.type;

          // TODO: append weekly attendance for each participant
          // if (participant.attend 
          //   && Object.values(participant.attend).length > 0
          //   && Object.values(Object.values(participant.attend)[0]).length > 0) {
            
          //   // For each group in the students attendance record
          //   for (const [group, attend] of Object.entries(participant.attend)) {
          //       // For each student check their attendance record
          //       for (const [week, value] of Object.entries(attend)) {
          //           // For each week in that group attendance
          //           if (value.present) {
          //               
          //           }
          //       }
          //   };
          // }

          var participantCSVRow = `"${id}","${child_name}","${groupName}","${facilitatorname}","${email}","${phone}", "${parent_first_name}", "${parent_last_name}", "${parent_name}", "${dayOfWeek}", "${time}", "${county}", "${studentYear}", "${themes}", "${dateOfFirstSession}", "${eventId}", "${facilitatorId}", "${folderId}", "${created_at}", "${type}"`;

          csvRows.push(participantCSVRow);
      });
      
    }

    let result = csvRows.reduce((prev, curr) => {
      return prev + '\n' + curr
    });
    return {
      'headers': {
        'Content-Type': 'text/csv',
        'Content-disposition': 'attachment; filename=testing.csv',
        'Access-Control-Allow-Origin': '*'
      },
      'body': result,
      'statusCode': 200
    };
  } catch(e) {
    console.log(e);
  }
}

const getSemester = async(semesterId) => {
  let params = {
      TableName: 'semester',
      Key: {
          'id': semesterId
      }
  };

  let semester;
  try {
    semester = await dynamo.get(params).promise();
    return semester.Item;
  } catch(e) {
    console.log(e);
    return null;
  }
};

const getGroup = async(groupId) => {
  let params = {
      TableName: 'group',
      Key: {
          'id': groupId
      }
  };
  let group;
  try {
    group = await dynamo.get(params).promise();
    console.log(group);
    return group.Item;
  } catch(e) {
    console.log(e);
    return null;
  }
}

const getParticipants = async(groupId) => {
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