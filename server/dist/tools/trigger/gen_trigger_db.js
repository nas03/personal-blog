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
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const getTrigger = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const fileStream = fs_1.default.createReadStream("src/tools/trigger/triggers.sql");
    const rl = readline_1.default.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });
    const triggers = [];
    try {
        for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
            _c = rl_1_1.value;
            _d = false;
            const line = _c;
            let trigger = ``;
            if (line != "")
                trigger += line;
            else {
                triggers.push(trigger);
                trigger = "";
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return triggers;
});
function generateTriggers() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_2, _b, _c;
        // TODO: Create loop for multiple trigger
        // const triggers = await getTrigger()
        const fileStream = fs_1.default.createReadStream("src/tools/trigger/db.sql");
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        try {
            // Note: we use the crlfDelay option to recognize all instances of CR LF
            // ('\r\n') in input.txt as a single line break.
            for (var _d = true, rl_2 = __asyncValues(rl), rl_2_1; rl_2_1 = yield rl_2.next(), _a = rl_2_1.done, !_a; _d = true) {
                _c = rl_2_1.value;
                _d = false;
                const line = _c;
                // Each line in input.txt will be successively available here as `line`.
                if (line.includes("CREATE TABLE")) {
                    const lineTokens = line.split(" ");
                    const table = lineTokens[lineTokens.length - 1].replace(/"/g, "").trim();
                    const content = `CREATE TRIGGER update_${table}
    BEFORE
        UPDATE
    ON ${table}
    FOR EACH ROW
EXECUTE FUNCTION update_ts_updated();\n`;
                    fs_1.default.appendFile("src/tools/trigger.sql", content, (err) => {
                        err && console.log(err);
                    });
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_2.return)) yield _b.call(rl_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
}
generateTriggers();
