export class ApiError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isApiError = true;
  }

  static badRequest(msg, code) {
    return new ApiError(400, msg, code);
  }
  static unauthorized(msg, code) {
    return new ApiError(401, msg, code);
  }
  static forbidden(msg, code) {
    return new ApiError(403, msg, code);
  }
  static notFound(msg, code) {
    return new ApiError(404, msg, code);
  }
  static conflict(msg, code) {
    return new ApiError(409, msg, code);
  }
  static internal(msg, code) {
    return new ApiError(500, msg, code);
  }
}
