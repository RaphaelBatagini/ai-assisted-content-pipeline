const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const BUCKET = process.env.AWS_S3_BUCKET;

const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

async function uploadFileLocally({ buffer, mimetype, userId, siteId }) {
  const ext = mimetype.split('/')[1];
  const subDir = path.join(LOCAL_UPLOADS_DIR, String(userId), String(siteId));
  fs.mkdirSync(subDir, { recursive: true });
  const filename = `${uuidv4()}.${ext}`;
  fs.writeFileSync(path.join(subDir, filename), buffer);
  const urlPath = `/uploads/${userId}/${siteId}/${filename}`;
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  return { url: `${baseUrl}${urlPath}` };
}

async function uploadFileToS3({ buffer, mimetype, userId, siteId }) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const ext = mimetype.split('/')[1];
  const key = `uploads/${userId}/${siteId}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  const url = `https://${BUCKET}.s3.amazonaws.com/${key}`;
  return { url };
}

async function uploadFile({ buffer, mimetype, userId, siteId }) {
  if (!BUCKET) {
    return uploadFileLocally({ buffer, mimetype, userId, siteId });
  }
  return uploadFileToS3({ buffer, mimetype, userId, siteId });
}

module.exports = { uploadFile };
