// awsS3.js

const multer = require("multer");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const S3 = new AWS.S3();

// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware for uploading files to AWS S3
const singleMulterUpload = (fieldName) => {
  return upload.single(fieldName); // This allows single file upload for a specific field
};

// Function to upload file to S3
const awsUploadFile = (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,  // Replace with your bucket name
    Key: `${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  return S3.upload(params).promise();  // Returns a promise with the upload result
};

module.exports = { singleMulterUpload, awsUploadFile };
