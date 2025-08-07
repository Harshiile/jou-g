export class JOUError extends Error {
  statusCode: number;
  constructor(statusCode: number, msg?: string) {
    super();
    this.message = msg || "Internal Server Error";
    this.statusCode = statusCode;
  }
}
