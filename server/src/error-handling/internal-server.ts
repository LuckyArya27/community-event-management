import { CustomErrorHandler } from './custom-error-handler';
import { StatusCodes } from 'http-status-codes';

class InternalServerError extends CustomErrorHandler {
  constructor(message: string, title: string) {
    super(message, title);
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

export { InternalServerError };