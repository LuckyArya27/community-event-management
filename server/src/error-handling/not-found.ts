import { CustomErrorHandler } from './custom-error-handler';
import { StatusCodes } from 'http-status-codes';

class NotFoundError extends CustomErrorHandler {
  constructor(message: string, title: string) {
    super(message, title);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

export { NotFoundError };