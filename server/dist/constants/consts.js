"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authStrategy = exports.flag = exports.redisPath = exports.authorization = exports.zodError = exports.message = exports.code = void 0;
exports.code = Object.freeze({
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    INVALID: 402,
    FORBIDDEN: 403,
    CONFLICT: 409,
    VALIDATOR: 422,
    ERROR: 500,
});
exports.message = Object.freeze({
    system_error: "system_error",
    fields_cannot_blank: "fields_cannot_blank",
    not_authorized: "not_authorized",
    user_not_exists: "user_not_exists",
    user_existed: "user_existed",
    fields_invalid: "fields_invalid",
    token_expired: "token_expired",
    user_forbidden: "user_forbidden",
    update_failed: "update_failed",
    create_failed: "create_failed",
    redis_error: "redis_error",
});
exports.zodError = Object.freeze({
    required_error: exports.message.fields_cannot_blank,
    invalid_type_error: exports.message.fields_invalid,
});
exports.authorization = Object.freeze({
    SYSTEM_ADMINISTRATOR: 1,
    USER: 2,
});
exports.redisPath = Object.freeze({
    users_profile: Object.freeze({
        user: "users_profile:user",
    }),
    users_basic_data: Object.freeze({
        user: "users_basic_data:user",
    }),
    posts: Object.freeze({
        post: "posts:post",
        user: "posts:user",
    }),
    categories: Object.freeze({
        category: "categories:category",
    }),
    user_access_histories: Object.freeze({
        history: "user_access_histories:history",
    }),
    user_refresh_tokens: Object.freeze({
        token: "user_refresh_tokens:token",
    }),
});
exports.flag = Object.freeze({
    TRUE: 1,
    FALSE: 0,
});
exports.authStrategy = Object.freeze({
    LOCAL: "local",
});
