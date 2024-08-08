"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const TokenSchema = zod_1.z.object({
    user_id: zod_1.z.string(),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
const AccessTokenSchema = TokenSchema.extend({
    email: zod_1.z.string(),
    authorization_id: zod_1.z.number().optional(),
});
const RefreshTokenSchema = TokenSchema.extend({
    email: zod_1.z.string(),
});
