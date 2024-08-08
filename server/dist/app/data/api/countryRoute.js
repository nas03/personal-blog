"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const domain_1 = __importDefault(require("../../../app/data/domain"));
const express_1 = require("express");
const countryRouter = (0, express_1.Router)();
countryRouter.get("/all", domain_1.default.getCountries);
exports.default = countryRouter;
