"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const manageRoute_1 = __importDefault(require("../../../app/category/api/manageRoute"));
const express_1 = require("express");
const categoryRoute = (0, express_1.Router)();
categoryRoute.use("/category", manageRoute_1.default);
exports.default = categoryRoute;
