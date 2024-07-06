/* Library */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { aws } from '@/helpers';
/* Services */

/* Config library */
dotenv.config();
const envList = [
	'DB_USER',
	'DB_PASSWORD',
	'DB_PORT',
	'DB_HOST',
	'DB_NAME',
	'CLOUDFLARE_TOKEN',
	'CLOUDFLARE_ACCESS_KEY_ID',
	'CLOUDFLARE_SECRET_KEY_ID',
	'CLOUDFLARE_HOST',
	'CLOUDFLARE_HOST_EU',
];

/* Settings */
const PORT = process.env.PORT || 5500;
/* Config server */
const server = express();
// Enable Cross-Origin Resource Sharing (CORS)
server.use(cors());

// Parse URL-encoded request bodies (form submissions)
server.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON request bodies
server.use(bodyParser.json());

// Parse and manage cookies
server.use(cookieParser());

// Logging HTTP Request
server.use(morgan('dev'));

const startup = async () => {
	await aws.getParameters(envList);
	server.listen(PORT, () => {
		console.log(`⚡️[server]: Started at port ${PORT}`);
	});
};

startup();
