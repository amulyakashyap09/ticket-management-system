import { Request, Response, NextFunction } from 'express';
import { initializeDataSource } from '../orm/dbCreateConnection';

import { User } from 'orm/entities/User';
import { JwtPayload } from 'types/JwtPayload';
import { createJwtToken } from 'utils/createJwtToken';
import { CustomError } from 'utils/response/custom-error/CustomError';

/**
 * Handles user login by verifying email and password, and generating a JWT token upon successful authentication.
 *
 * @param req - Express request object containing the login credentials in the body.
 * @param res - Express response object used to send the response back to the client.
 * @param next - Express next middleware function to pass control to the next middleware.
 *
 * @returns A JSON response with a JWT token if authentication is successful, or an error response if authentication fails.
 *
 * @throws {CustomError} If the email or password is incorrect, or if there is an error during token creation or database operations.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const _dataSource = await initializeDataSource();
  const userRepository = _dataSource.getRepository(User);

  try {
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      const customError = new CustomError(400, 'General', 'Not Found', ['Incorrect email or password']);
      return next(customError);
    }

    if (!user.checkIfPasswordMatch(password)) {
      const customError = new CustomError(400, 'General', 'Not Found', ['Incorrect email or password']);
      return next(customError);
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      type: user.type,
    };

    try {
      const token = createJwtToken(jwtPayload);
      res.customSuccess(200, 'Token successfully created.', { token });
    } catch (err) {
      const customError = new CustomError(400, 'Raw', "Token can't be created", null, err);
      return next(customError);
    }
  } catch (err) {
    const customError = new CustomError(400, 'Raw', 'Error', null, err);
    return next(customError);
  }
};
