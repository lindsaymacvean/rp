const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

exports.handler = async(event, context, callback) => {

    var data = JSON.parse(event.body);

    // This endpoint does not seem to be called by the front end...

    // Check if it is a readable project entry (if not send email warning)
    // First Check if a user already exists for this Email and PPS number
    // Either insert or update the user

    response = {
        'statusCode': 200,
        'body': 'ok',
        'headers': {
            'Access-Control-Allow-Origin': '*',
        }
    }

    return response;
};

// The following is a payload from Google Form
// 2022-04-15T18:28:26.232Z	43da3e03-d859-4f92-bb36-83c386d468df	INFO	{
//     '397580085': {
//       question: 'Upload your Tusla Children First Certificate                 ',
//       answer: [ '1xoC9UY_Bpiv16Vtvh8okZ3kLQUKDJfSN' ]
//     },
//     '668240073': {
//       question: 'Name & Surname of next of kin ',
//       answer: 'Amelia norman'
//     },
//     '686485464': {
//       question: 'Do you work in a Workshop or on the Readable Project? Please select',
//       answer: 'Readable Project'
//     },
//     '723686850': { question: 'Date of Birth', answer: '1988-08-09' },
//     '807410528': { question: 'EIRCODE', answer: 'test' },
//     '862586168': { question: 'Surname', answer: 'macvean' },
//     '1101563730': { question: 'First Name', answer: 'lindsay' },
//     '1130390469': { question: 'Email Address', answer: 'lindsaymacvean@gmail.com' },
//     '1163629015': { question: 'PPS Number', answer: '121212121c' },
//     '1168939214': {
//       question: 'Are you in full-time employment elsewhere, in addition to this part-time employment in a DAI Workshop/Readable Project?    ',
//       answer: 'yes'
//     },
//     '1381149780': {
//       question: 'Will you be working every week or subbing occasionally?',
//       answer: 'every week'
//     },
//     '1481823688': { question: 'Address', answer: 'test' },
//     '1510389555': { question: 'Mobile phone for next of kin', answer: '0877086920' },
//     '1814285644': { question: 'Mobile Number', answer: '0877086920' },
//     '1955092166': { question: 'Choose PRSI Contribution Class  ', answer: 'A' },
//     '1980586813': {
//       question: 'Enter the date on your DAI Vetting Disclosure notice showing your Garda Vetting is complete  ',
//       answer: '2021-08-09'
//     },
//     '2002930037': {
//       question: 'If you work in one of the Workshop please choose the location below from the drop down menu, if not, choose Not Applicable:',
//       answer: 'Carlow: Tullow'
//     }
//   }
  