import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const errorHandlingMiddleware = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const customError = {
    msg: err.message || "INTERNAL_SERVER_ERROR",
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    title: err.title || "InternalServerErrorException"
  }
  res.status(customError.statusCode).json({ message: customError.msg, title: customError.title });
};

export default errorHandlingMiddleware;