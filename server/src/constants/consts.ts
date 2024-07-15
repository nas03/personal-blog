export const code = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INVALID: 402,
  FORBIDDEN: 403,
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
});

export const zodError = Object.freeze({
  required_error: message.fields_cannot_blank,
  invalid_type_error: message.fields_invalid,
});

export const authorization = Object.freeze({
  SYSTEM_ADMINISTRATOR: 1,
  USER: 2,
});
