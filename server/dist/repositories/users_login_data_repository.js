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
exports.deleteUserLoginData = exports.createUserLoginData = exports.getUserLoginData = void 0;
const consts_1 = require("../constants/consts");
const helpers_1 = require("../helpers");
const getUserLoginData = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield (0, helpers_1.db)("users_login_data")
        .leftJoin("users_basic_data", "users_basic_data.user_id", "users_login_data.user_id")
        .select("users_basic_data.user_id", "users_login_data.email", "users_login_data.hashed_password")
        .where({ "users_login_data.email": email, "users_login_data.delete_flag": consts_1.flag.FALSE })
        .first();
    return query;
});
exports.getUserLoginData = getUserLoginData;
const createUserLoginData = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield trx("users_login_data").insert(payload).returning("*");
            return query;
        }));
        return transaction[0];
    }
    catch (error) {
        helpers_1.logger.error(error);
        return false;
    }
});
exports.createUserLoginData = createUserLoginData;
const deleteUserLoginData = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield trx("users_login_data").where("user_id", user_id).softDelete();
        }));
        return transaction;
    }
    catch (error) {
        helpers_1.logger.error(error);
        return false;
    }
});
exports.deleteUserLoginData = deleteUserLoginData;
