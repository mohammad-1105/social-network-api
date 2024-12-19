export class ApiError extends Error {
  statusCode: number;
  success: boolean;
  message: string;
  errors: never[];
  data: any;

  constructor(
    statusCode: number,
    message: string = "Something Went Wrong !",
    errors: never[] = [],
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (!!stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
