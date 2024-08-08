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
exports.demoQuery = void 0;
// @ts-nocheck
const dotenv_1 = __importDefault(require("dotenv"));
const knex_1 = __importDefault(require("knex"));
const consts_1 = require("../../constants/consts");
const knex_paginate_1 = require("knex-paginate");
const knex_2 = __importDefault(require("./knex"));
console.log(`env = ${process.env.NODE_ENV}`);
dotenv_1.default.config();
(0, knex_paginate_1.attachPaginate)();
function attachSoftDelete() {
    knex_1.default.QueryBuilder.extend("softDelete", function () {
        const postProcessResponse = typeof this.client.config.postProcessResponse === "function"
            ? this.client.config.postProcessResponse
            : function (key) {
                return key;
            };
        this.update({ delete_flag: consts_1.flag.TRUE });
        return this.client.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.transacting(trx);
            const delResult = postProcessResponse(Object.assign({}, result));
            return { data: result, delResult };
        }));
    });
}
attachSoftDelete();
const environment = process.env.NODE_ENV || "local";
const config = knex_2.default[environment];
const db = (0, knex_1.default)(config);
const demoQuery = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db.raw("SELECT 1");
        console.log(`⚡️[server]: Database is connected at ${config.connection.host}:${config.connection.port}:${config.connection.database}`);
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
exports.demoQuery = demoQuery;
exports.default = db;
