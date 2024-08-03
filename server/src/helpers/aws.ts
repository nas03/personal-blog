import { ListBucketsCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID,
  },
};

const s3Client = new S3Client(awsConfig as S3ClientConfig);

const awsStartUp = async () => {
  // FORWARD AWS CONNECTION TO LOCALHOST
  exec(
    `ssh -i ${process.env.AWS_EC2_KEY_PAIR} 
        -L 5432:${process.env.AWS_RDS_ENDPOINT}:5432 
        ${process.env.AWS_EC2_USERNAME}@${process.env.AWS_EC2_ENDPOINT}`
  );
  setTimeout(() => {
    console.log(`⚡️[server]: Port forwarding to AWS RDS success`);
  }, 500);

  // TEST AWS S3 CONNECTION
  await listBuckets().then((response) => {
    if (!response) console.log("⚡️[server]: Connect to S3");
    console.log("⚡️[server]: Connect to S3 successfully");
  });
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
