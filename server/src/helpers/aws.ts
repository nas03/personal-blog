import { ListBucketsCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { GetParametersCommand, GetParametersCommandInput, GetParametersRequest, SSMClient, SSMClientConfig } from "@aws-sdk/client-ssm";
import { exec } from "child_process";
import dotenv from "dotenv";
import { demoQuery } from "./db";
import logger from "./logger";
dotenv.config()

const awsConfig = {
  region: process.env.CONFIG_AWS_REGION,
  credentials: {
    accessKeyId: process.env.CONFIG_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CONFIG_AWS_SECRET_KEY_ID,
  },
};

const s3Client = new S3Client(awsConfig as S3ClientConfig);
const ssmClient = new SSMClient(awsConfig as SSMClientConfig)

const retryDbConnection = async (maxRetries: number, delay: number) => {
  let retry = 0;

  const attemptConnection = () => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        console.log(`⚡️[server]: Retry DB connection: ${++retry} times`);
        try {
          const conn = await demoQuery();
          resolve(conn);
        } catch (error) {
          console.error("⚡️[server]: Failed to connect to the database:", error);
          if (retry < maxRetries) {
            resolve(attemptConnection());
          } else {
            resolve(null);
          }
        }
      }, delay);
    });
  };

  return attemptConnection();
};
const getEnvParams = async () => {
  try {
    let retry = 0
    const fetchParamsCommand: GetParametersCommandInput[]= [
      {
        Names
      }
    ] as GetParametersCommand<GetParametersCommandInput>
    const params = await ssmClient.send(fetchParamsCommand)
    const attemptConnection = () => {
      return new Promise ((resolve) => {
        setTimeout(async () => {
          console.log(`⚡️[server]: Retry getting params from Parameters Store: ${++retry} times`);
          try {
            const conn = await 
          } catch (error) {
            logger.error(`⚡️[server]: Failed fetching params from Parameters Store. Trace: ${error}`);
            if(retry < 10) {
              resolve(attemptConnection())
            }else {
              resolve(null)
            }
          }
        })
      })
    }
  } catch (error) {
    logger.error(error)
  }
}
const awsStartUp = async () => {
  // FORWARD AWS CONNECTION TO LOCALHOST
  if (process.env.NODE_ENV === "local") {
    const command = `ssh -i ${process.env.EC2_AWS_KEY_PAIR} -L 5433:${process.env.RDS_AWS_ENDPOINT}:${process.env.RDS_AWS_PORT} ${process.env.EC2_AWS_USERNAME}@${process.env.EC2_AWS_ENDPOINT}`;
    exec(command);
    console.log(`⚡️[server]: Port forwarding to AWS RDS success`);
  }

  await retryDbConnection(10, 1000);
  console.log("⚡️[server]: Connected to Database");
  // TEST AWS S3 CONNECTION
  await listBuckets().then((response) => {
    if (!response) console.log("⚡️[server]: Connect to S3");
    console.log("⚡️[server]: Connect to S3 successfully");
  });
  return true;
};

const listBuckets = async () => {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    return data.Buckets;
  } catch (err) {
    return false;
  }
};
export { awsStartUp, listBuckets };

