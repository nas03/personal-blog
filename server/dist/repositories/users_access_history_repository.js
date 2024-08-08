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
exports.createAccessHistory = void 0;
const helpers_1 = require("../helpers");
const createAccessHistory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield helpers_1.db.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const newAccessLog = yield trx("users_access_history").insert(payload);
            if (!newAccessLog)
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
exports.createAccessHistory = createAccessHistory;
