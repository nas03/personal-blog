"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Library
const express_1 = require("express");
// Router
const authRoute_1 = __importDefault(require("../../../app/user/api/authRoute"));
const adminRoute_1 = __importDefault(require("./adminRoute"));
const userRoute = (0, express_1.Router)();
userRoute.use("/user/auth", authRoute_1.default);
userRoute.use('/user/admin', adminRoute_1.default);
exports.default = userRoute;
