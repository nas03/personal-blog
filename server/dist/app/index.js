"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
const api_1 = __importDefault(require("../app/category/api"));
const api_2 = __importDefault(require("../app/post/api"));
const api_3 = __importDefault(require("../app/user/api"));
const api_4 = __importDefault(require("./data/api"));
exports.route = [api_3.default, api_2.default, api_1.default, api_4.default];
