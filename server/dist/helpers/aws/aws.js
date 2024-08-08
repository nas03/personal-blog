"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBuckets = exports.awsStartUp = exports._getEnvParams = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
const lodash_1 = __importDefault(require("lodash"));
const db_1 = require("../db");
const logger_1 = __importDefault(require("../logger"));
const common_1 = __importDefault(require("./common"));
dotenv_1.default.config();
const awsConfig = {
    region: process.env.CONFIG_AWS_REGION,
    credentials: {
        accessKeyId: process.env.CONFIG_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.CONFIG_AWS_SECRET_KEY_ID,
    },
};
const s3Client = new client_s3_1.S3Client(awsConfig);
const ssmClient = new client_ssm_1.SSMClient(awsConfig);
const retryDbConnection = (maxRetries, delay) => __awaiter(void 0, void 0, void 0, function* () {
    let retry = 0;
    const attemptConnection = () => {
        return new Promise((resolve) => {
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                console.log(`⚡️[server]: Retry DB connection: ${++retry} times`);
                try {
                    const conn = yield (0, db_1.demoQuery)();
                    resolve(conn);
                }
                catch (error) {
                    console.error("⚡️[server]: Failed to connect to the database:", error);
                    if (retry < maxRetries) {
                        resolve(attemptConnection());
                    }
                    else {
                        resolve(null);
                    }
                }
            }), delay);
        });
    };
    return attemptConnection();
});
const _getEnvParams = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = [];
        const paramsPageNo = Math.floor(common_1.default.parametersName.length / 10);
        for (let i = 0; i < paramsPageNo; i++) {
            requests.push({ Names: common_1.default.parametersName.slice(i * 10, (i + 1) * 10) });
        }
        requests.push({
            Names: common_1.default.parametersName.slice(paramsPageNo * 10, paramsPageNo * 10 + (common_1.default.parametersName.length % 10)),
        });
        const fetchParams = yield Promise.all(requests.map((request) => {
            const command = new client_ssm_1.GetParametersCommand(request);
            return ssmClient.send(command, { requestTimeout: 3000 });
        }));
        fetchParams.forEach((response) => {
            var _a;
            (_a = response.Parameters) === null || _a === void 0 ? void 0 : _a.forEach((parameter) => {
                if (parameter.Name && parameter.Value && lodash_1.default.isNil(process.env[parameter.Name])) {
                    process.env[parameter.Name] = parameter.Value;
                }
            });
        });
        console.log("⚡️[server]: Loaded Env Parameters Success");
    }
    catch (error) {
        logger_1.default.error(`⚡️[server]: Failed fetching params from Parameters Store. Trace: ${error}`);
    }
});
exports._getEnvParams = _getEnvParams;
const awsStartUp = () => __awaiter(void 0, void 0, void 0, function* () {
    // FORWARD AWS CONNECTION TO LOCALHOST
    if (process.env.NODE_ENV === "local") {
        const command = `ssh -i ${process.env.EC2_AWS_KEY_PAIR} -L 5433:${process.env.RDS_AWS_ENDPOINT}:${process.env.RDS_AWS_PORT} ${process.env.EC2_AWS_USERNAME}@${process.env.EC2_AWS_ENDPOINT}`;
        (0, child_process_1.exec)(command);
        console.log(`⚡️[server]: Port forwarding to AWS RDS success`);
    }
    yield retryDbConnection(10, 1000);
    console.log("⚡️[server]: Connected to Database");
    // TEST AWS S3 CONNECTION
    yield listBuckets().then((response) => {
        if (!response)
            console.log("⚡️[server]: Connect to S3");
        console.log("⚡️[server]: Connect to S3 successfully");
    });
    return true;
});
exports.awsStartUp = awsStartUp;
const listBuckets = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield s3Client.send(new client_s3_1.ListBucketsCommand({}));
        return data.Buckets;
    }
    catch (err) {
        return false;
    }
});
exports.listBuckets = listBuckets;
