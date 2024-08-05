import { ListBucketsCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import dotenv from "dotenv";
import { demoQuery } from "./db";
dotenv.config()
;

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID,
  },
};

const s3Client = new S3Client(awsConfig as S3ClientConfig);

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

const awsStartUp = async () => {
  // FORWARD AWS CONNECTION TO LOCALHOST
  if (process.env.NODE_ENV === "local") {
    const command = `ssh -i ${process.env.AWS_EC2_KEY_PAIR} -L 5433:${process.env.AWS_RDS_ENDPOINT}:5432 ${process.env.AWS_EC2_USERNAME}@${process.env.AWS_EC2_ENDPOINT}`;
    exec(command);
    console.log(`⚡️[server]: Port forwarding to AWS RDS success`);
  }

  await retryDbConnection(10, 1000);

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
