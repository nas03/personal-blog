"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const countryRoute_1 = __importDefault(require("./countryRoute"));
const dataRoute = (0, express_1.Router)();
dataRoute.use("/data/country", countryRoute_1.default);
exports.default = dataRoute;
