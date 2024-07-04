const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const moment = require('moment')

const uploadFile = async (avatar) => {
  const s3 = await connectS3()
  const avatarContent = avatar.content
  const contentType = avatar.contentType
  const avatarName = moment().utc().format('YYYYMMDDHHmmss') + avatar.filename
  const params = {
    Body: avatarContent,
    Bucket: process.env.BUCKET,
    Key: `files/images/${avatarName}`,
    ContentType: contentType,
  }

  await s3.send(new PutObjectCommand(params))

  return {
    Location: `https://${params.Bucket}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`,
  }
}

const uploadCSV = async (csvData, name) => {
  const s3 = await connectS3()
  const fileName = name + moment().utc().format('YYYYMMDDHHmmss') + '.csv'
  const params = {
    Body: csvData,
    Bucket: process.env.BUCKET,
    Key: `files/csv/${fileName}`,
  }

  await s3.send(new PutObjectCommand(params))

  return {
    Location: `https://${params.Bucket}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`,
  }
}


const uploadCSVRebateHistory = async (csvData, fileName) => {
  const s3 = await connectS3()
  const params = {
    Body: csvData,
    Bucket: process.env.BUCKET,
    Key: fileName,
  }

  await s3.send(new PutObjectCommand(params))

  return {
    Location: `https://${params.Bucket}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`,
  }
}

const connectS3 = async () => {
  try {
    return new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_PUBLIC_KEY_ID,
        secretAccessKey: process.env.AWS_PRIVATE_KEY_ID,
      },
    })
  } catch (error) {
    throw error.message
  }
}

const uploadFileToS3 = async (file, directory) => {
  const s3 = await connectS3()
  const params = {
    Bucket: process.env.BUCKET,
    Key: directory,
    Body: file.content,
    ContentType: file.contentType,
  }

  const res = await s3.send(new PutObjectCommand(params))
  if (res?.$metadata?.httpStatusCode === 200) {
    return {
      Location: `https://${params.Bucket}.s3.${process.env.REGION}.amazonaws.com/${params.Key}`,
    }
  } else {
    return false
  }
}

module.exports = {
  uploadFile,
  connectS3,
  uploadFileToS3,
  uploadCSV,
  uploadCSVRebateHistory,
}
