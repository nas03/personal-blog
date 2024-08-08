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
exports.getOsData = exports.createRedisKey = exports.isJSON = exports.uploadFile = exports.getErrorMsg = exports.zodValidate = exports.getUserIdByToken = exports.verifyToken = exports.createRefreshToken = exports.createAccessToken = exports.createResponse = void 0;
const common_1 = require("../constants/common");
const consts_1 = require("../constants/consts");
const helpers_1 = require("../helpers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const lodash_1 = __importDefault(require("lodash"));
const createResponse = (res, isSuccess, data, code = 200, message = "") => {
    const response = {
        status: null,
        message: "",
        data: null,
    };
    isSuccess ? (response["status"] = "success") : (response["status"] = "error");
    response["message"] = message;
    response["data"] = data || null;
    res.set("Access-Control-Allow-Origin", "http://localhost:5173");
    res.set("Access-Control-Allow-Credentials", "true");
    return res.status(code).json(response);
};
exports.createResponse = createResponse;
const createAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { iat: Math.floor(Date.now() / 1000) }), `${process.env.JWT_SECRET}`, {
        expiresIn: `${process.env.JWT_ACCESS_EXP}`,
    });
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(Object.assign({}, payload), String(process.env.JWT_SECRET));
};
exports.createRefreshToken = createRefreshToken;
const verifyToken = (token) => {
    const decodedToken = jsonwebtoken_1.default.verify(token, `${process.env.JWT_SECRET}`);
    if (!decodedToken) {
        return false;
    }
    if (Date.now() / 1000 > decodedToken.exp) {
        return false;
    }
    return true;
};
exports.verifyToken = verifyToken;
const getUserIdByToken = (req) => {
    const authHeader = req.headers["authorization"] || "";
    if (!authHeader) {
        throw new common_1.ErrorLog(consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
    }
    const token = authHeader.split(" ")[1];
    const verify = jsonwebtoken_1.default.verify(token, `${process.env.JWT_SECRET}`);
    if (!verify)
        throw new common_1.ErrorLog(consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
    return verify.user_id;
};
exports.getUserIdByToken = getUserIdByToken;
const zodValidate = (data, schema, options) => {
    const validate = lodash_1.default.isEmpty(options) ? schema.safeParse(data) : schema.safeParse(data, options);
    if (!validate.success) {
        throw new common_1.ErrorLog(consts_1.code.BAD_REQUEST, validate.error.issues[0].message);
    }
    return validate.data;
};
exports.zodValidate = zodValidate;
const getErrorMsg = (error) => {
    const { message: errMessage, code: errCode } = error;
    const responseCode = consts_1.message.hasOwnProperty(errMessage) ? errCode : consts_1.code.ERROR;
    const responseMessage = consts_1.message.hasOwnProperty(errMessage) ? errMessage : consts_1.message.system_error;
    return { responseCode, responseMessage };
};
exports.getErrorMsg = getErrorMsg;
// TODO: Finish upload file function
const uploadFile = (fileName, content, path, contentType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const upload = yield helpers_1.r2.putObject(path, fileName, content, contentType);
        if (!upload)
            throw new common_1.ErrorLog(consts_1.code.ERROR, consts_1.message.system_error);
        return upload;
    }
    catch (error) {
        helpers_1.logger.error(error);
        throw new common_1.ErrorLog(consts_1.code.ERROR, consts_1.message.system_error);
    }
});
exports.uploadFile = uploadFile;
const isJSON = (data) => {
    try {
        const parse = JSON.parse(data);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.isJSON = isJSON;
const createRedisKey = (path, id) => {
    return id ? `${path}:${id}` : `${path}:*`;
};
exports.createRedisKey = createRedisKey;
const getOsData = (req) => {
    try {
        // User-Agent: Mozilla/5.0 (<system-information>) <platform> (<platform-details>) <extensions>
        // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59
        const userAgent = req.headers["user-agent"];
        if (!userAgent)
            throw Error();
        if (userAgent.includes("Postman"))
            return "Postman";
        return userAgent.slice(userAgent.indexOf("("), userAgent.indexOf(")") + 1);
    }
    catch (error) {
        helpers_1.logger.error(error);
        return null;
    }
};
exports.getOsData = getOsData;
