export const code = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INVALID: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATOR: 422,
  ERROR: 500,
});

export const message = Object.freeze({
  system_error: "system_error",
  fields_cannot_blank: "fields_cannot_blank",
  not_authorized: "not_authorized",
  user_not_exists: "user_not_exists",
  fields_invalid: "fields_invalid",
  token_expired: "token_expired",
  user_forbidden: "user_forbidden",
  update_failed: "update_failed",
  create_failed: "create_failed",
  redis_error: "redis_error",
  data_not_exists: "data_not_exists",
});

export const zodError = Object.freeze({
  required_error: message.fields_cannot_blank,
  invalid_type_error: message.fields_invalid,
});

export const authorization = Object.freeze({
  SYSTEM_ADMINISTRATOR: 1,
  USER: 2,
});

export const redisPath = Object.freeze({
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
    title: "categories:title",
  }),
  user_access_histories: Object.freeze({
    history: "user_access_histories:history",
  }),
  user_refresh_tokens: Object.freeze({
    token: "user_refresh_tokens:token",
  }),
});
