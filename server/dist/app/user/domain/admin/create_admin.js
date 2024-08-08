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
exports.createAdmin = void 0;
const consts_1 = require("../../../../constants/consts");
const schema_1 = require("../../../../constants/schema");
const helpers_1 = require("../../../../helpers");
const repositories_1 = require("../../../../repositories");
const utilities_1 = require("../../../../utilities");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // VERIFY USER PERMISSION
        const user_id = (0, utilities_1.getUserIdByToken)(req);
        const userData = yield repositories_1.users_basic_data_repository.getUserBasicData(user_id);
        if (!userData || userData.authorization_id !== consts_1.authorization.SYSTEM_ADMINISTRATOR) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.FORBIDDEN, consts_1.message.user_forbidden);
        }
        // VALIDATE PARAMS
        const validateSchema = schema_1.UsersBasicDataSchema.omit({ user_id: true }).merge(zod_1.z.object({ password: zod_1.z.string() }));
        const validate = (0, utilities_1.zodValidate)(req.body, validateSchema);
        // NEW ADMIN DATA
        const hashed_password = yield bcryptjs_1.default.hash(validate.password, 15);
        const payload = Object.assign(Object.assign({}, validate), { authorization_id: consts_1.authorization.SYSTEM_ADMINISTRATOR, hashed_password: hashed_password, last_login_date: null, last_login_ip: req.ip || "" });
        const responseCreateAdmin = yield repositories_1.users_basic_data_repository.createNewUser(payload);
        if (!responseCreateAdmin) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.ERROR, consts_1.message.system_error);
        }
        return (0, utilities_1.createResponse)(res, true);
    }
    catch (error) {
        helpers_1.logger.error(error);
        const { responseCode, responseMessage } = (0, utilities_1.getErrorMsg)(error);
        return (0, utilities_1.createResponse)(res, false, null, responseCode, responseMessage);
    }
});
exports.createAdmin = createAdmin;
