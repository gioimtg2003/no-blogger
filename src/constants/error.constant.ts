/** *****************User***************** */
export enum UserError {
  USER_NOT_FOUND = 100,
  USER_REACHES_CREATE_TEAM_LIMIT = 101,
  USER_CANNOT_CREATE = 102,
  USER_REACHES_JOIN_TEAM_LIMIT = 103,
  USER_CANNOT_JOIN_TEAM = 104,
  USER_CANNOT_LEAVE_TEAM = 105,
  CREATE_USER_FAILED = 106,
  USER_ALREADY_EXISTS = 107,
}

/** *****************End***************** */

/** *****************Team***************** */

export enum TeamError {
  TEAM_NOT_FOUND = 200,
  INVITE_TOKEN_NOT_FOUND = 201,
  INVITE_TOKEN_EXPIRED = 202,
  INVITE_TOKEN_ALREADY_USED = 203,
  INVITE_CREATION_FAILED = 204,
  INVITE_CANNOT_RESEND = 205,
  INVITE_EMAIL_MISMATCH = 206,
  JOIN_REQUEST_NOT_FOUND = 207,
  JOIN_REQUEST_ALREADY_HANDLED = 208,
  INVITE_NOT_FOUND = 209,
}

/** *****************End***************** */

/** *****************Resource***************** */
export enum ResourceError {
  RESOURCE_NOT_FOUND = 400,
  SLUG_ALREADY_EXISTS = 401,
  PARENT_NOT_FOUND = 402,
  RESOURCE_LIMIT_REACHED = 403,
  RESOURCE_CANNOT_UPDATE = 404,
  RESOURCE_CANNOT_DELETE = 405,
  RESOURCE_HAS_CHILDREN = 406,
  RESOURCE_IN_USE = 407,
}

/** *****************End***************** */

/** *****************Blog***************** */

/** *****************End***************** */

/** *****************Auth***************** */
export enum AuthError {
  AUTH_INVALID_CREDENTIALS = 300,
  AUTH_INVALID_SESSION = 301,
  NOT_AUTHORIZED = 302,
  AUTH_USER_NOT_IN_TEAM = 303,
}
/** *****************End***************** */

/** *****************System Error***************** */
export enum SystemError {
  INTERNAL_SERVER_ERROR = 500,
  REQUIRED__HEADER_TEAM_ID = 501,
}
/** *****************End***************** */
