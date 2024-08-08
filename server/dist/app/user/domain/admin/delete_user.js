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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = void 0;
const consts_1 = require("../../../../constants/consts");
const repositories_1 = require("../../../../repositories");
const utilities_1 = require("../../../../utilities");
const zod_1 = require("zod");
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // VALIDATE PARAMS
        const validateSchema = zod_1.z.object({ user_id: zod_1.z.string(consts_1.zodError).uuid(consts_1.zodError.invalid_type_error) });
        const validate = (0, utilities_1.zodValidate)(req.params, validateSchema);
        const user_id = validate.user_id;
        // VERIFY USER PERMISSION
        const userData = yield repositories_1.users_basic_data_repository.getUserBasicData(user_id);
        if (!userData || userData.authorization_id !== consts_1.authorization.SYSTEM_ADMINISTRATOR) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.FORBIDDEN, consts_1.message.user_forbidden);
        }
        // DELETE USER DATA
        const deleteUser = yield repositories_1.users_basic_data_repository.deleteUserData(user_id);
        return (0, utilities_1.createResponse)(res, true);
    }
    catch (error) {
        const { responseCode, responseMessage } = (0, utilities_1.getErrorMsg)(error);
        return (0, utilities_1.createResponse)(res, false, null, responseCode, responseMessage);
    }
});
exports.deleteUser = deleteUser;
