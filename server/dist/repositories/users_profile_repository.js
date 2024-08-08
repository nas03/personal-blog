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
exports.deleteUserProfile = exports.updateUserProfile = exports.createUserProfile = exports.getUserProfile = void 0;
const helpers_1 = require("../helpers");
const db_1 = __importDefault(require("../helpers/db"));
const getUserProfile = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield (0, db_1.default)("users_profile")
        .select("id", "user_id", "profile_image_url", "address", "country")
        .where("user_id", user_id)
        .first();
    return query;
});
exports.getUserProfile = getUserProfile;
const createUserProfile = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield db_1.default.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield trx("users_profile").insert(payload);
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
exports.createUserProfile = createUserProfile;
const updateUserProfile = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield db_1.default.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield trx("users_profile").update(payload).where("user_id", payload.user_id);
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
exports.updateUserProfile = updateUserProfile;
const deleteUserProfile = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield db_1.default.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const query = yield (0, db_1.default)("users_profile").where("user_id", user_id).softDelete();
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
exports.deleteUserProfile = deleteUserProfile;
