import { ListBucketsCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { GetParametersCommand, GetParametersRequest, Parameter, SSMClient, SSMClientConfig } from "@aws-sdk/client-ssm";
import { exec } from "child_process";
import dotenv from "dotenv";
import _ from "lodash";
import { demoQuery } from "../db";
import logger from "../logger";
import awsCommon from "./common";
dotenv.config();

const awsConfig = {
  region: process.env.CONFIG_AWS_REGION,
  credentials: {
    accessKeyId: process.env.CONFIG_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CONFIG_AWS_SECRET_KEY_ID,
  },
};

const s3Client = new S3Client(awsConfig as S3ClientConfig);
const ssmClient = new SSMClient(awsConfig as SSMClientConfig);

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

const _getEnvParams = async () => {
  try {
    const requests: GetParametersRequest[] = [];
    const paramsPageNo = Math.floor(awsCommon.parametersName.length / 10);
    for (let i = 0; i < paramsPageNo; i++) {
      requests.push({ Names: awsCommon.parametersName.slice(i * 10, (i + 1) * 10) });
    }
    requests.push({
      Names: awsCommon.parametersName.slice(paramsPageNo * 10, paramsPageNo * 10 + (awsCommon.parametersName.length % 10)),
    });

    const fetchParams = await Promise.all(
      requests.map((request) => {
        const command = new GetParametersCommand(request);
        return ssmClient.send(command, { requestTimeout: 3000 });
      })
    );
    fetchParams.forEach((response) => {
      response.Parameters?.forEach((parameter: Parameter) => {
        if (parameter.Name && parameter.Value && _.isNil(process.env[parameter.Name])) {
          process.env[parameter.Name] = parameter.Value;
        }
      });
    });
    console.log("⚡️[server]: Loaded Env Parameters Success");
  } catch (error) {
    logger.error(`⚡️[server]: Failed fetching params from Parameters Store. Trace: ${error}`);
  }
};

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
export { _getEnvParams, awsStartUp, listBuckets };

