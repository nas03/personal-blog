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
exports.signup = void 0;
// Library
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Utilities
const utilities_1 = require("../../../../utilities");
// Constants
const consts_1 = require("../../../../constants/consts");
// Repository
const repositories_1 = require("../../../../repositories");
// library
const zod_1 = require("zod");
// helper
const ValidateSchema = zod_1.z.object({
    first_name: zod_1.z.string(consts_1.zodError),
    last_name: zod_1.z.string(consts_1.zodError),
    email: zod_1.z.string(consts_1.zodError).email({ message: consts_1.zodError.invalid_type_error }),
    password: zod_1.z.string(consts_1.zodError),
    phone_number: zod_1.z.string(consts_1.zodError),
});
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = (0, utilities_1.zodValidate)(req.body, ValidateSchema);
        if (!(0, utilities_1.emailValidator)(data.email) || !(0, utilities_1.phoneNumberValidator)(data.phone_number)) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.BAD_REQUEST, consts_1.message.fields_invalid);
        }
        const userData = yield repositories_1.users_login_data_repository.getUserLoginData(data.email);
        if (userData) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.CONFLICT, consts_1.message.user_existed);
        }
        // CREATE NEW USER BASIC DATA
        const hashed_password = yield bcryptjs_1.default.hash(data.password, 10);
        const userPayload = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            authorization_id: consts_1.authorization.USER,
            phone_number: data.phone_number,
            hashed_password: hashed_password,
            last_login_date: new Date().toISOString(),
            last_login_ip: req.ip || "::1",
        };
        const newUser = yield repositories_1.users_basic_data_repository.createNewUser(userPayload);
        if (!newUser) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.ERROR, consts_1.message.system_error);
        }
        return (0, utilities_1.createResponse)(res, true);
    }
    catch (error) {
        console.log(error);
        const { responseCode, responseMessage } = (0, utilities_1.getErrorMsg)(error);
        return (0, utilities_1.createResponse)(res, false, null, responseCode, responseMessage);
    }
});
exports.signup = signup;
// SSO
