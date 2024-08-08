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
const logger_1 = __importDefault(require("../helpers/logger"));
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_KEY_ID,
    },
});
const putObject = (path, fileName, fileContent, contentType) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: `${path}/${fileName}`,
        Body: fileContent,
        ContentType: contentType || undefined,
    });
    try {
        const put = yield s3Client.send(command);
        return put.$metadata.httpStatusCode;
    }
    catch (error) {
        logger_1.default.error(`Error uploading file: ${fileName} Filepath: ${path}/${fileName} - Bucket: ${process.env.BUCKET}`, error);
        return false;
    }
});
// TODO: Get Signed URL
/* import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Use the expiresIn property to determine how long the presigned link is valid.
console.log(await getSignedUrl(S3, new GetObjectCommand({ Bucket: "my-bucket-name", Key: "dog.png" }), { expiresIn: 3600 }));
// https://my-bucket-name.<accountid>.r2.cloudflarestorage.com/dog.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential<credential>&X-Amz-Date=<timestamp>&X-Amz-Expires=3600&X-Amz-Signature=<signature>&X-Amz-SignedHeaders=host&x-id=GetObject

// You can also create links for operations such as putObject to allow temporary write access to a specific key.
console.log(await getSignedUrl(S3, new PutObjectCommand({ Bucket: "my-bucket-name", Key: "dog.png" }), { expiresIn: 3600 }));
 */
const getObject = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const getObjectCommand = new client_s3_1.GetObjectCommand({
            Bucket: String(process.env.BUCKET),
            Key: path,
        });
        const responseGetObject = yield s3Client.send(getObjectCommand);
        return responseGetObject;
    }
    catch (error) {
        logger_1.default.log("error", error);
        return false;
    }
});
const deleteObject = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleteObjectCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: process.env.BUCKET,
            Key: path,
        });
        const responseDeleteObject = yield s3Client.send(deleteObjectCommand);
        return responseDeleteObject;
    }
    catch (error) {
        logger_1.default.log("error", error);
        return false;
    }
});
const copyObject = (currPath, newPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const copyObjectCommand = new client_s3_1.CopyObjectCommand({
            Bucket: process.env.BUCKET,
            CopySource: `${process.env.BUCKET}/${currPath}`,
            Key: newPath,
        });
        const responseCopyObject = yield s3Client.send(copyObjectCommand);
        return responseCopyObject;
    }
    catch (error) {
        logger_1.default.log("error", error);
        return false;
    }
});
const listObject = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const listObjectCommand = new client_s3_1.ListObjectsCommand({
            Bucket: process.env.BUCKET,
            Prefix: path,
        });
        const responseListObjectCommand = yield s3Client.send(listObjectCommand);
        return responseListObjectCommand;
    }
    catch (error) {
        logger_1.default.log("error", error);
        return false;
    }
});
const getObjectDetail = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const headObjectCommand = new client_s3_1.HeadObjectCommand({
            Bucket: process.env.BUCKET,
            Key: path,
        });
        const responseHeadObjectCommand = yield s3Client.send(headObjectCommand);
        return responseHeadObjectCommand;
    }
    catch (error) {
        logger_1.default.log("error", error);
        return false;
    }
});
const r2 = { putObject, getObject, deleteObject, copyObject };
exports.default = r2;
