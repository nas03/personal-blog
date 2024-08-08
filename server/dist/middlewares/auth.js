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
exports.verifyToken = void 0;
const consts_1 = require("../constants/consts");
const helpers_1 = require("../helpers");
const utilities_1 = require("../utilities");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return (0, utilities_1.createResponse)(res, false, authHeader, consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
        }
        const refresh_token = authHeader.split(" ")[1];
        const decodedToken = jsonwebtoken_1.default.verify(refresh_token, String(process.env.JWT_SECRET));
        if (!decodedToken || !decodedToken.user_id) {
            return (0, utilities_1.createResponse)(res, false, decodedToken, consts_1.code.UNAUTHORIZED, consts_1.message.not_authorized);
        }
        if (Date.now() / 1000 > decodedToken.exp) {
            return (0, utilities_1.createResponse)(res, false, decodedToken, consts_1.code.UNAUTHORIZED, consts_1.message.token_expired);
        }
        next();
    }
    catch (error) {
        helpers_1.logger.error(error);
        return (0, utilities_1.createResponse)(res, false, error, consts_1.code.UNAUTHORIZED);
    }
});
exports.verifyToken = verifyToken;
