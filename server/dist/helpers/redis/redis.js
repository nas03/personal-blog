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
exports.redisStart = void 0;
const common_1 = require("../../constants/common");
const consts_1 = require("../../constants/consts");
const utilities_1 = require("../../utilities");
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../logger"));
let redisClient = (0, redis_1.createClient)({
    password: process.env.REDIS_CLOUD_PASSWORD,
    socket: {
        host: process.env.REDIS_CLOUD_HOST,
        port: Number(process.env.REDIS_CLOUD_PORT),
    },
});
redisClient.on("connect", () => {
    console.log("⚡️[server]: Connected to Redis");
});
redisClient.on("error", (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("⚡️[server]: Error connecting to Redis:", err);
}));
const redisStart = () => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.connect();
    return redisClient;
});
exports.redisStart = redisStart;
const createObjectIndex = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO
});
const setCache = (key_1, values_1, ...args_1) => __awaiter(void 0, [key_1, values_1, ...args_1], void 0, function* (key, values, exp = Number(process.env.REDIS_DEFAULT_TTL)) {
    try {
        let setValues = null;
        switch (typeof values) {
            case "object":
                yield redisClient.set(key, JSON.stringify(values));
                break;
            default:
                yield redisClient.set(key, String(values));
        }
        redisClient.expire(key, exp);
        return true;
    }
    catch (error) {
        throw new common_1.ErrorLog(consts_1.code.ERROR, consts_1.message.redis_error);
    }
});
const getCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield redisClient.get(key);
        if (!data)
            return null;
        if ((0, utilities_1.isJSON)(data)) {
            return JSON.parse(data);
        }
        return data;
    }
    catch (error) {
        logger_1.default.error(error);
        throw new common_1.ErrorLog(consts_1.code.ERROR, consts_1.message.redis_error);
    }
});
const deleteCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const delData = yield redisClient.del(key);
        if (!delData)
            return false;
        return true;
    }
    catch (error) {
        logger_1.default.error(error);
        throw new common_1.ErrorLog(consts_1.code.ERROR, consts_1.message.redis_error);
    }
});
const updateCache = (key, values) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateKey = JSON.stringify(key);
        const updateValues = JSON.stringify(values);
        const updateData = yield redisClient.set(updateKey, updateValues, { KEEPTTL: true });
        if (updateData !== "OK")
            return false;
        return true;
    }
    catch (error) {
        logger_1.default.error(error);
        throw new common_1.ErrorLog(consts_1.code.ERROR, consts_1.message.redis_error);
    }
});
const redis = { deleteCache, getCache, setCache, updateCache };
exports.default = redis;
