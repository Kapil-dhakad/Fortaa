const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.trim() : null;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.trim() : null;

const s3Config = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

if (accessKeyId && secretAccessKey) {
  s3Config.credentials = {
    accessKeyId,
    secretAccessKey,
  };
}

const s3 = new S3Client(s3Config);

module.exports = s3;
