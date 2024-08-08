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
exports.deleteLoginToken = exports.addLoginToken = exports.getLoginToken = void 0;
const consts_1 = require("../constants/consts");
const helpers_1 = require("../helpers");
const getLoginToken = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = (0, helpers_1.db)("users_login_token")
        .select("id", "user_id", "session_id", "access_token", "refresh_token", "exp", "iat")
        .where("user_id", user_id)
        .where("delete_flag", consts_1.flag.FALSE)
        .orderBy("iat", "desc")
        .first();
    return query;
});
exports.getLoginToken = getLoginToken;
const addLoginToken = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield trx("users_login_token").insert(Object.assign(Object.assign({}, payload), { iat: payload.iat, exp: payload.exp }));
            if (!query)
                return false;
            return query;
        }));
        return transaction;
    }
    catch (error) {
        helpers_1.logger.error(error);
        return false;
    }
});
exports.addLoginToken = addLoginToken;
const deleteLoginToken = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield trx("users_login_token").where("user_id", user_id).softDelete();
            if (!query)
                return false;
            return true;
        }));
        return transaction;
    }
    catch (error) {
        helpers_1.logger.error(error);
        return false;
    }
});
exports.deleteLoginToken = deleteLoginToken;
