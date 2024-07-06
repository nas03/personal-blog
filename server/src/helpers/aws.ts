import logger from '@/helpers/logger';
import {
	SSMClient,
	GetParametersRequest,
	GetParametersCommand,
	GetParameterCommandInput,
} from '@aws-sdk/client-ssm';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const ssmClient = new SSMClient({
	region: process.env.REGION,
	credentials: {
		accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
		secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
	},
});

const s3Client = new S3Client({
	region: process.env.REGION,
	credentials: {
		accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
		secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
	},
});

const uploadObject = async () => {};

const getParameters = async (listEnv: string[]) => {
	try {
		const command: GetParametersRequest = {
			Names: [...listEnv],
			WithDecryption: false,
		};

		const parametersCommand = new GetParametersCommand(command);
		const responseParameters = await ssmClient.send(parametersCommand);
		if (responseParameters.Parameters) {
			responseParameters.Parameters.forEach((param) => {
				process.env[String(param.Name)] = param.Value;
			});
		}
	} catch (error) {
		logger.error('Error fetch parameters');
	}
};
const aws = { getParameters };
export default aws;
