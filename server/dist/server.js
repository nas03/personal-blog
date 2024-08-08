"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
/* Library */
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
/* Router */
const app_1 = require("./app");
/* Services */
const aws_1 = require("./helpers/aws/aws");
const redis_1 = __importStar(require("./helpers/redis/redis"));
const log_routes_1 = require("./tools/debug/log_routes");
/* Config library */
dotenv_1.default.config();
/* Settings */
const PORT = process.env.PORT || 5500;
const HOST = process.env.HOST || "::";
/* Config server */
const server = (0, express_1.default)();
// Enable Cross-Origin Resource Sharing (CORS)
server.use((0, cors_1.default)({
    origin: "http://localhost:5173", // Client origin
    credentials: true, // Allow credentials (cookies) to be sent
}));
// Parse URL-encoded request bodies (form submissions)
server.use(body_parser_1.default.urlencoded({ extended: true }));
// Parse JSON request bodies
server.use(body_parser_1.default.json());
// Parse and manage cookies
server.use((0, cookie_parser_1.default)());
// Logging HTTP Request
server.use((0, morgan_1.default)("dev"));
server.use("/api/v1", app_1.route);
const startup = () => __awaiter(void 0, void 0, void 0, function* () {
    // STARTUP SERVER
    server.listen(Number(PORT), () => {
        console.log(`⚡️[server]: Started at port ${PORT}`);
    });
    // VERIFY CONNECTIONS
    yield (0, aws_1._getEnvParams)();
    yield Promise.all([(0, redis_1.redisStart)(), (0, aws_1.awsStartUp)()]);
    yield redis_1.default.setCache("startup:test", "Success");
    const getCache = yield redis_1.default.getCache("startup:test");
    console.log(getCache);
    server._router.stack.forEach(log_routes_1.printRoute.bind(null, []));
});
startup();
