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
exports.refreshToken = void 0;
const consts_1 = require("../../../../constants/consts");
const repositories_1 = require("../../../../repositories");
const utilities_1 = require("../../../../utilities");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const moment_1 = __importDefault(require("moment"));
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies[`${process.env.REFRESH_COOKIE_NAME}`];
        if (!token) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
        }
        const { user_id, email, exp } = jsonwebtoken_1.default.decode(token, { json: true });
        const dbToken = yield repositories_1.users_login_data_repository.getUserLoginData(user_id);
        if (!dbToken || dbToken.refresh_token !== token) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.ERROR, consts_1.message.system_error);
        }
        const verify = (0, utilities_1.verifyToken)(token);
        if (!verify) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
        }
        const userData = yield repositories_1.users_basic_data_repository.getUserBasicData(user_id);
        if (!userData) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.ERROR, consts_1.message.user_not_exists);
        }
        const accessToken = (0, utilities_1.createAccessToken)({
            user_id: user_id,
            email: email,
            authorization_id: userData.authorization_id,
        });
        const newRefreshToken = (0, utilities_1.createRefreshToken)({
            user_id: user_id,
            email: email,
            exp: exp,
            iat: Math.floor(Date.now() / 1000),
        });
        res.cookie(String(process.env.REFRESH_COOKIE_NAME), newRefreshToken, {
            httpOnly: true,
            maxAge: moment_1.default.duration(1, "day").asSeconds(),
            sameSite: "strict",
            secure: true,
        });
        return (0, utilities_1.createResponse)(res, true, { accessToken });
    }
    catch (error) {
        const { responseCode, responseMessage } = (0, utilities_1.getErrorMsg)(error);
        return (0, utilities_1.createResponse)(res, false, null, responseCode, responseMessage);
    }
});
exports.refreshToken = refreshToken;
