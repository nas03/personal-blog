import logger from '@/helpers/logger';
import {
	SSMClient,
	GetParametersRequest,
	GetParametersCommand,
	GetParameterCommandInput,
} from '@aws-sdk/client-ssm';
import {
	S3Client,
	S3ClientConfig,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	CopyObjectCommand,
	ListObjectsCommand,
	HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { ElastiCacheClient } from '@aws-sdk/client-elasticache';

import dotenv from 'dotenv';
import { String } from 'aws-sdk/clients/apigateway';

dotenv.config();

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID,
		secretAccessKey: process.env.R2_SECRET_KEY_ID,
	},
} as S3ClientConfig);

const putObject = async (
	path: string,
	fileName: string,
	fileContent: any,
	contentType?: string
) => {
	const command = new PutObjectCommand({
		Bucket: process.env.BUCKET,
		Key: `${path}/${fileName}`,
		Body: fileContent,
		ContentType: contentType || undefined,
	});

	try {
		const { ETag } = await s3Client.send(command);
		console.log(
			`File ${fileName} uploaded with ETag ${ETag} and file path ${path}/${fileName}`
		);
		return true;
	} catch (error) {
		logger.error(
			`Error uploading file: ${fileName} Filepath: ${path}/${fileName} - Bucket: ${process.env.BUCKET}`,
			error
		);
		return false;
	}
};

const getObject = async (path: string) => {
	try {
		const getObjectCommand = new GetObjectCommand({
			Bucket: String(process.env.BUCKET),
			Key: path,
		});
		const responseGetObject = await s3Client.send(getObjectCommand);
		return responseGetObject;
	} catch (error) {
		logger.log('error', error);
		return false;
	}
};
const deleteObject = async (path: string) => {
	try {
		const deleteObjectCommand = new DeleteObjectCommand({
			Bucket: process.env.BUCKET,
			Key: path,
		});
		const responseDeleteObject = await s3Client.send(deleteObjectCommand);
		return responseDeleteObject;
	} catch (error) {
		logger.log('error', error);
		return false;
	}
};
const copyObject = async (currPath: string, newPath: string) => {
	try {
		const copyObjectCommand = new CopyObjectCommand({
			Bucket: process.env.BUCKET,
			CopySource: `${process.env.BUCKET}/${currPath}`,
			Key: newPath,
		});
		const responseCopyObject = await s3Client.send(copyObjectCommand);
		return responseCopyObject;
	} catch (error) {
		logger.log('error', error);
		return false;
	}
};

const listObject = async (path: string) => {
	try {
		const listObjectCommand = new ListObjectsCommand({
			Bucket: process.env.BUCKET,
			Prefix: path,
		});
		const responseListObjectCommand = await s3Client.send(listObjectCommand);
		return responseListObjectCommand;
	} catch (error) {
		logger.log('error', error);
		return false;
	}
};

const getObjectDetail = async (path: string) => {
	try {
		const headObjectCommand = new HeadObjectCommand({
			Bucket: process.env.BUCKET,
			Key: path,
		});
		const responseHeadObjectCommand = await s3Client.send(headObjectCommand);
		return responseHeadObjectCommand;
	} catch (error) {
		logger.log('error', error);
		return false;
	}
};
const r2 = { putObject, getObject, deleteObject, copyObject };
export default r2;
