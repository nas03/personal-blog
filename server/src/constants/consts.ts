export const code = Object.freeze({
  ERROR: 500,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
});

export const message = Object.freeze({
  system_error: "system error",
  fields_cannot_blank: "fields cannot be blank",
  not_authorized: "user is not authorized",
  user_not_exists: "user is not existed",
  fields_invalid: "fields are invalid",
  token_expired: "token is expired",
  user_forbidden: "user is forbidden",
});

export const authorization = Object.freeze({
  SYSTEM_ADMINISTRATOR: 1,
  USER: 2,
});
