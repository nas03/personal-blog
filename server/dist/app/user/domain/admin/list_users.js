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
exports.listUsers = void 0;
const consts_1 = require("../../../../constants/consts");
const helpers_1 = require("../../../../helpers");
const repositories_1 = require("../../../../repositories");
const utilities_1 = require("../../../../utilities");
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = (0, utilities_1.getUserIdByToken)(req);
        const userData = yield repositories_1.users_basic_data_repository.getUserBasicData(user_id);
        if (!userData || userData.authorization_id !== consts_1.authorization.SYSTEM_ADMINISTRATOR) {
            return (0, utilities_1.createResponse)(res, false, null, consts_1.code.FORBIDDEN, consts_1.message.user_forbidden);
        }
        const responseListUser = yield repositories_1.users_basic_data_repository.listUsers();
        return (0, utilities_1.createResponse)(res, true, responseListUser);
    }
    catch (error) {
        helpers_1.logger.error(error);
        const { responseCode, responseMessage } = (0, utilities_1.getErrorMsg)(error);
        return (0, utilities_1.createResponse)(res, false, null, responseCode, responseMessage);
    }
});
exports.listUsers = listUsers;
