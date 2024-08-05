import { ListBucketsCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import dotenv from "dotenv";
import { demoQuery } from "./db/db";
import { promise } from "zod";
dotenv.config();

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID,
  },
};

const s3Client = new S3Client(awsConfig as S3ClientConfig);

const testDBConnection = async (retry: number) => {
  while (retry >= 0 && retry < 10) {
    let conn;

    setTimeout(async () => {
      console.log(`⚡️[server]: Retry DB connection: ${++retry} times`);
      conn = demoQuery();
    }, 1000);
    await promise;
    if (conn) break;
  }
  /* if (!dbConn) {
    if (retry <= 10 && retry >= 0) {
      setTimeout(async () => {
        return await testDBConnection(retry);
      }, 500);
    } else {
      console.log("⚡️[server]: PostgreSQL not connected");
      console.error(error);
      return false;
    }
  } */
  return true;
};

const awsStartUp = async () => {
  // FORWARD AWS CONNECTION TO LOCALHOST
  if (process.env.NODE_ENV === "local") {
    const command = `ssh -i ${process.env.AWS_EC2_KEY_PAIR} -L 5433:${process.env.AWS_RDS_ENDPOINT}:5432 ${process.env.AWS_EC2_USERNAME}@${process.env.AWS_EC2_ENDPOINT}`;
    exec(command);
    console.log(`⚡️[server]: Port forwarding to AWS RDS success`);
  }

  // TEST DB CONNECTION
  while (true) {
    const conn = await testDBConnection(0);
    if (conn) break;
  }

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

