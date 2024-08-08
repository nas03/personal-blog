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
exports.login = void 0;
// Library
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const moment_1 = __importDefault(require("moment"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
// Repository
const repositories_1 = require("../../../../repositories");
// Constants
const consts_1 = require("../../../../constants/consts");
const helpers_1 = require("../../../../helpers");
const utilities_1 = require("../../../../utilities");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // VALIDATE LOGIN PARAMS
        const validateSchema = zod_1.z.object({
            email: zod_1.z.string(consts_1.zodError).email({ message: consts_1.zodError.invalid_type_error }),
            password: zod_1.z.string(consts_1.zodError).min(1, { message: consts_1.zodError.invalid_type_error }),
            staySignedIn: zod_1.z.boolean(consts_1.zodError),
        });
        const data = (0, utilities_1.zodValidate)(req.body, validateSchema);
        // CHECK USER EXISTED
        const userData = yield repositories_1.users_login_data_repository.getUserLoginData(data.email);
        if (!userData) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.UNAUTHORIZED, consts_1.message.user_not_exists);
        }
        // VALIDATE PASSWORD
        const validatePassword = bcryptjs_1.default.compare(data.password, userData.hashed_password);
        if (!validatePassword) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
        }
        // VERIFY IF REQUEST IS DUPLICATED
        const existedToken = yield repositories_1.users_login_token_repository.getLoginToken(userData.user_id);
        if (existedToken && existedToken.exp > Math.floor(Date.now() / 1000)) {
            const payload = { session_id: existedToken.session_id, access_token: existedToken.access_token };
            return (0, utilities_1.createResponse)(res, true, payload);
        }
        // CREATE LOGIN TOKENS
        const access_token = (0, utilities_1.createAccessToken)({ user_id: userData.user_id, email: userData.email });
        const session_id = (0, uuid_1.v4)();
        // GENERATE REFRESH_TOKEN IF STAYED SIGN IN
        if (data.staySignedIn) {
            const exp = Math.floor(Date.now() / 1000) + moment_1.default.duration(1, "day").asSeconds();
            const iat = Math.floor(Date.now() / 1000);
            const refreshToken = (0, utilities_1.createRefreshToken)({
                user_id: userData.user_id,
                email: userData.email,
                exp: exp,
                iat: iat,
            });
            res.cookie(String(process.env.REFRESH_COOKIE_NAME), refreshToken, {
                httpOnly: true,
                maxAge: moment_1.default.duration(1, "day").asMilliseconds(),
                sameSite: "strict",
                // Only set secure = true when communicate through https
                // secure: true,
            });
            yield repositories_1.users_login_token_repository.addLoginToken({
                user_id: userData.user_id,
                session_id: session_id,
                access_token: access_token,
                refresh_token: refreshToken,
                exp: exp,
                iat: iat,
            });
        }
        // LOG USER ACCESS HISTORY
        const accessHistoryPayload = {
            ip_address: req.ip || "::1",
            platform: (0, utilities_1.getOsData)(req) || "",
            user_agent: req.headers["user-agent"] || "",
            user_id: userData.user_id,
        };
        yield repositories_1.users_access_history_repository.createAccessHistory(accessHistoryPayload);
        // RETURN
        const payload = { session_id: session_id, access_token: access_token };
        return (0, utilities_1.createResponse)(res, true, payload);
    }
    catch (error) {
        helpers_1.logger.error(error);
        console.log(error);
        const { responseCode, responseMessage } = (0, utilities_1.getErrorMsg)(error);
        return (0, utilities_1.createResponse)(res, false, null, responseCode, responseMessage);
    }
});
exports.login = login;
// SSO
// Authenticator
