"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_admin_1 = require("./create_admin");
const delete_user_1 = require("./delete_user");
const list_users_1 = require("./list_users");
const admin = {
    deleteUser: delete_user_1.deleteUser,
    listUsers: list_users_1.listUsers,
    createAdmin: create_admin_1.createAdmin,
};
exports.default = admin;
