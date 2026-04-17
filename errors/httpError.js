/**
 * Structured HTTP error for controllers to map to status codes and JSON bodies.
 */
export class HttpError extends Error {
  /**
   * @param {number} statusCode - HTTP status (e.g. 403)
   * @param {string} message - User-facing or API message
   * @param {Record<string, unknown>} [extra] - Optional fields merged into JSON (e.g. { reason })
   */
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.extra = extra;
  }
}
