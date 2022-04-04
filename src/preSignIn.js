const AWS = require('aws-sdk');


exports.handler = async(event, context) => {
    console.log(JSON.stringify(event));

    callback(null, event);
};