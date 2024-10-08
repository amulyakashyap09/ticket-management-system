import { Request, Response, NextFunction } from 'express';

import { CustomError } from '../utils/response/custom-error/CustomError';

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.log(JSON.stringify(err));
  return res.status(err.HttpStatusCode ?? 500).json(err.JSON);
};
