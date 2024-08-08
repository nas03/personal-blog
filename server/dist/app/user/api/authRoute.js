"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Library
const express_1 = require("express");
//Domain functions
const auth_1 = __importDefault(require("../../../app/user/domain/auth"));
const authRouter = (0, express_1.Router)();
authRouter.post("/login", auth_1.default.login);
authRouter.post("/signup", auth_1.default.signup);
authRouter.get("/refresh", auth_1.default.refreshToken);
/* authRouter.get("/test", verifyToken, async (req, res) => {
  console.log(req.cookies);
  return createResponse(res, true, { cookie: JSON.stringify(req.cookies) });
});
 */
exports.default = authRouter;
