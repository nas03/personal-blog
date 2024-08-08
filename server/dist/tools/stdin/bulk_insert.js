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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const knex_1 = __importDefault(require("knex"));
const minimist_1 = __importDefault(require("minimist"));
const readline_1 = __importDefault(require("readline"));
dotenv_1.default.config();
const knexConfig = {
    client: "pg",
    connection: {
        host: "localhost",
        user: "postgres",
        password: String(process.env.DB_LOCAL_PASSWORD),
        database: "personal_blog",
        port: 5432,
    },
};
const db = (0, knex_1.default)(knexConfig);
const testDBConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db.raw("SELECT 1");
        console.log(`⚡️[server]: Database is connected `);
    }
    catch (error) {
        console.log("⚡️[server]: PostgreSQL not connected");
        console.error(error);
    }
});
const bulkInsert = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const args = (0, minimist_1.default)(process.argv.slice(2));
        const file = args["f"] || args["file"];
        const table = args["t"] || args["table"];
        const columns = args._;
        if (!file || !table || !columns) {
            console.log("bun run insert:bulkInsert [-f|--file] ${file_path} [-t|--table] ${table} column1 column2 .... ");
            return;
        }
        yield testDBConnection();
        const fileStream = fs_1.default.createReadStream(file);
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        const payload = [];
        try {
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
                _c = rl_1_1.value;
                _d = false;
                const line = _c;
                const data = line.trim().split(",");
                const dummyObj = {};
                columns.forEach((col) => {
                    dummyObj[`${col}`] = data[columns.findIndex((el) => el === col)];
                });
                console.log(Object.assign({}, dummyObj));
                payload.push(Object.assign({}, dummyObj));
                yield db(table).insert(Object.assign({}, dummyObj));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.log("⚡️[server]: Finished");
        return process.exit();
    }
    catch (error) {
        if (error.message.includes("ENOENT")) {
            console.log('file path must use "\\ instead of "\"');
        }
        return process.exit();
    }
});
bulkInsert();
