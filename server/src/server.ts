import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import config from "@/config"
/* Config library */
dotenv.config();
/* Settings */
const PORT = process.env.PORT || 5500;
/* Config server */
const server = express();

server.use(cors());

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

server.use(cookieParser());

server.listen(PORT, () => {
	console.log(`⚡️ [server]: Started at port ${PORT}`);
});
