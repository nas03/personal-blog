"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, printf, colorize, align, json } = winston_1.format;
const myFormat = combine(timestamp({
    format: 'YYYY-MM-DD hh:mm:ss.SSS A',
}), printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`));
const logger = (0, winston_1.createLogger)({
    level: "error",
    format: myFormat,
    transports: [
        new winston_1.transports.File({
            filename: "log/sys.log",
            level: "error",
        }),
        new winston_1.transports.Console(),
    ],
});
exports.default = logger;
