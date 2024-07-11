const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition')
const {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3')
const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm')

const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs')

const { envCommon, commonSiteId } = require('constant')

const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_PUBLIC_KEY_ID,
    secretAccessKey: process.env.AWS_PRIVATE_KEY_ID,
  },
})

const sqsClient = new SQSClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_PUBLIC_KEY_ID,
    secretAccessKey: process.env.AWS_PRIVATE_KEY_ID,
  },
})

const SSM_Client = new SSMClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_PUBLIC_KEY_ID,
    secretAccessKey: process.env.AWS_PRIVATE_KEY_ID,
  },
})

const awsFaceDetection = async (source, target, threshold) => {
  try {
    const client = new RekognitionClient({
      credentials: {
        accessKeyId: process.env.AWS_PUBLIC_KEY_ID,
        secretAccessKey: process.env.AWS_PRIVATE_KEY_ID,
      },
    })
    const params = {
      SourceImage: {
        S3Object: {
          Bucket: process.env.BUCKET,
          Name: source,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: process.env.BUCKET,
          Name: target,
        },
      },
      SimilarityThreshold: threshold,
    }

    const command = new CompareFacesCommand(params)
    const compare = await client.send(command)
    const result = customAwsResponse(compare)
    return {
      status: true,
      data: result,
    }
  } catch (err) {
    console.log(err)
    return {
      status: false,
      data: err.message,
    }
  }
}

const customAwsResponse = (awsResponse) => {
  const cvData = awsResponse.FaceMatches.map((faceMatch, index) => {
    return {
      index: index + 1,
      position: {
        top: faceMatch.Face.BoundingBox.Top,
        left: faceMatch.Face.BoundingBox.Left,
      },
      similarity: faceMatch.Similarity,
    }
  })
  return cvData
}

const getObject = async (path) => {
  try {
    // get file from s3 bucket
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET,
      Key: path,
    })
    const res = await client.send(getObjectCommand)
    return res
  } catch (error) {
    console.log(error)
    return false
  }
}


const getObjectPaypay = async (path) => {
  // get file from s3 bucket
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.BUCKET_PAYPAY,
    Key: path,
  })
  const res = await client.send(getObjectCommand)
  return res
}

const copyObject = async (curPath, newPath) => {
  try {
    // copy the file to the new path
    const copyObjectCommand = new CopyObjectCommand({
      Bucket: process.env.BUCKET,
      CopySource: `${process.env.BUCKET}/${curPath}`,
      Key: newPath,
    })
    await client.send(copyObjectCommand)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const deleteObject = async (path) => {
  try {
    // delete the old file
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env.BUCKET,
      Key: path,
    })
    await client.send(deleteObjectCommand)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const putObject = async (path, file, type) => {
  try {
    // Put file to s3 bucket
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: path,
      Body: file,
      ContentType: type,
    })
    await client.send(putObjectCommand)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const listObject = async (path) => {
  try {
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: process.env.BUCKET,
      Prefix: path,
    })
    const res = await client.send(listObjectsCommand)
    return res.Contents
  } catch (error) {
    console.log(error)
    return false
  }
}

const detailObject = async (path) => {
  try {
    const headObjectCommand = new HeadObjectCommand({
      Bucket: process.env.BUCKET,
      Key: path,
    })
    const res = await client.send(headObjectCommand)
    return { status: true, data: res }
  } catch (error) {
    return { status: false, data: error }
  }
}

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })

const getParameters = async (listENV) => {
  const input = {
    Names: [...listENV],
    WithDecryption: false,
  }

  const command = new GetParametersCommand(input)
  const response = await SSM_Client.send(command)
  return response
}

const sendSqsMessage = async (message, delaySeconds = 60) => {
  const env = await _getEnvConfig([
    envCommon.BATCH_LOG_TIME_OUT_QUEUE,
  ], commonSiteId.P2TECH)

  const input = {
    QueueUrl: env[envCommon.BATCH_LOG_TIME_OUT_QUEUE],
    MessageBody: message,
    DelaySeconds: delaySeconds,
  }

  const command = new SendMessageCommand(input)

  const response = await sqsClient.send(command)

  return response
}

const sendSqsMessageRebateStatistics = async (message, groupId, DeduplicationId, delaySeconds = 0) => {
  try {
    const env = await _getEnvConfig([
      envCommon.REBATE_STATISTICS_QUEUE_URL,
    ], commonSiteId.P2TECH)

    const input = {
      QueueUrl: env[envCommon.REBATE_STATISTICS_QUEUE_URL],
      MessageDeduplicationId: DeduplicationId,
      MessageGroupId: `${groupId}`,
      MessageBody: message,
      DelaySeconds: delaySeconds,
    }

    const command = new SendMessageCommand(input)

    const response = await sqsClient.send(command)

    return response
  } catch (error) {
    console.log(error)
    return null
  }
}

const _getEnvConfig = async (listENV, site) => {
  let site_name
  switch (site) {
    case commonSiteId.P2TECH:
      site_name = 'p2t'
      break

    case commonSiteId.FXT:
      site_name = 'fxon'
      break

    case commonSiteId.ICPAY:
      site_name = 'icpay'
      break

    case commonSiteId.MY_FOREX:
      site_name = 'myforex'
      break

    default:
      site_name = 'p2t/multisite'
      break
  }
  const envArr = listENV.map((el) => `/${site_name}/${process.env.NODE_ENV.toLowerCase()}/${el}`)
  const parameters = await getParameters(envArr)
  const envs = {}
  parameters.Parameters.forEach((el) => {
    envs[el.Name.split('/').pop()] = el.Value
  })
  return envs
}

module.exports = {
  awsFaceDetection,
  getObject,
  getObjectPaypay,
  copyObject,
  deleteObject,
  putObject,
  listObject,
  detailObject,
  streamToString,
  getParameters,
  sendSqsMessage,
  sendSqsMessageRebateStatistics,
}
