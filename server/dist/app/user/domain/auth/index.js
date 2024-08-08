"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const login_1 = require("./login");
const refresh_token_1 = require("./refresh_token");
const signup_1 = require("./signup");
const auth = { login: login_1.login, signup: signup_1.signup, refreshToken: refresh_token_1.refreshToken };
exports.default = auth;
