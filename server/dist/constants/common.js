"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorLog = void 0;
const helpers_1 = require("../helpers");
class ErrorLog extends Error {
    constructor(code, message) {
        helpers_1.logger.error(`${code} - message: ${message}`);
        super(message);
        this.code = code;
    }
}
exports.ErrorLog = ErrorLog;
