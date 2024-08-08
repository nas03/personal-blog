"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = __importDefault(require("../../../app/user/domain/admin"));
const express_1 = require("express");
const adminRouter = (0, express_1.Router)();
adminRouter.delete("/delete/:user_id", admin_1.default.deleteUser);
adminRouter.get("/list-users", admin_1.default.listUsers);
adminRouter.post("/create-admin", admin_1.default.createAdmin);
exports.default = adminRouter;
