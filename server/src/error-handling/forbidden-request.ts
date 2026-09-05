import { CustomErrorHandler } from './custom-error-handler';
import { StatusCodes } from 'http-status-codes';

class ForbiddenError extends CustomErrorHandler {
  constructor(message: string, title: string) {
    super(message, title);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export { ForbiddenError };