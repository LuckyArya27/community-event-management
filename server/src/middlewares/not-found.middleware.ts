import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: 'Resource not found',
  });
};

export default notFoundMiddleware;