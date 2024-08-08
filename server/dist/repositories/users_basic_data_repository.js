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
exports.deleteUserData = exports.listUsers = exports.getUserBasicData = exports.createNewUser = void 0;
// helpers
const helpers_1 = require("../helpers");
// libraries
const consts_1 = require("../constants/consts");
const createNewUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            // CREATE NEW USER
            const newUserPayload = {
                first_name: payload.first_name,
                last_name: payload.last_name,
                authorization_id: payload.authorization_id,
                email: payload.email,
                phone_number: payload.phone_number,
            };
            const newUser = (yield trx("users_basic_data").insert(newUserPayload).returning("*")).at(0);
            if (!newUser)
                throw Error();
            // CREATE LOGIN DATA FOR NEW USER
            const loginDataPayload = {
                user_id: newUser.user_id,
                hashed_password: payload.hashed_password,
                email: payload.email,
                last_login_date: payload.last_login_date,
                last_login_ip: payload.last_login_ip,
            };
            const loginData = yield trx("users_login_data").insert(loginDataPayload);
            return true;
        }));
        return true;
    }
    catch (error) {
        helpers_1.logger.error(error);
        return false;
    }
});
exports.createNewUser = createNewUser;
const getUserBasicData = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield (0, helpers_1.db)("users_basic_data")
        .select("first_name", "last_name", "phone_number", "authorization_id", "user_id")
        .where("delete_flag", consts_1.flag.FALSE)
        .first();
    return query;
});
exports.getUserBasicData = getUserBasicData;
const listUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    // access_history && image_profile
    const query = yield (0, helpers_1.db)("users_basic_data as ubd")
        .leftJoin("users_access_history as uah", "uah.user_id", "ubd.user_id")
        .leftJoin("users_profile", "users_profile.user_id", "ubd.user_id")
        .leftJoin("users_login_data as uld", "uld.user_id", "ubd.user_id")
        .select(helpers_1.db.raw("CONCAT (ubd.first_name, ' ', ubd.last_name) AS full_name"), "ubd.authorization_id", "ubd.email", "ubd.phone_number", "users_profile.profile_image_url", "users_profile.country", "users_profile.address", "users_profile.stars", "uld.last_login_date", "uld.last_login_ip");
    return query;
});
exports.listUsers = listUsers;
const deleteUserData = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const [users_basic_data, users_login_data] = yield Promise.all([
                trx("users_basic_data").where("user_id", user_id).softDelete(),
                trx("users_login_data").where("user_id", user_id).softDelete(),
            ]);
        }));
        return transaction;
    }
    catch (error) {
        helpers_1.logger.error(error);
        return false;
    }
});
exports.deleteUserData = deleteUserData;
