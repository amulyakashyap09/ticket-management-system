import { Request, Response, NextFunction } from 'express';
import { initializeDataSource } from '../orm/dbCreateConnection';

import { User } from 'orm/entities/User';
import { CustomError } from 'utils/response/custom-error/CustomError';


/**
 * Retrieves a list of users from the database.
 *
 * @param req - The request object from Express.
 * @param res - The response object from Express.
 * @param next - The next middleware function in the Express stack.
 *
 * @returns A list of users in the response object with a status code of 200.
 * If an error occurs, it passes a custom error to the next middleware.
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  const _dataSource = await initializeDataSource();
  const userRepository = _dataSource.getRepository(User);
  try {
    const users = await userRepository.find();
    res.customSuccess(200, 'List of users.', users);
  } catch (err) {
    const customError = new CustomError(400, 'Raw', `Can't retrieve list of users.`, null, err);
    return next(customError);
  }
};


/**
 * Retrieves the details of a user by their ID.
 *
 * @param req - The request object, containing the user ID in the parameters.
 * @param res - The response object, used to send the response back to the client.
 * @param next - The next middleware function in the stack, used to pass control to the next middleware.
 *
 * @returns A promise that resolves to the user details if found, or an error if not found or if an error occurs.
 *
 * @throws CustomError - Throws a custom error if the user is not found or if an error occurs during the process.
 */
export const getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  const _dataSource = await initializeDataSource();
  const id = parseInt(req.params.id, 10);

  const userRepository = _dataSource.getRepository(User);
  try {
    const user = await userRepository.findOneBy({ id: id });

    if (!user) {
      const customError = new CustomError(404, 'General', `User with id:${id} not found.`, ['User not found.']);
      return next(customError);
    }
    res.customSuccess(200, 'User found', user);
  } catch (err) {
    const customError = new CustomError(400, 'Raw', 'Error', null, err);
    return next(customError);
  }
};

export const addUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, type, password } = req.body;
  const _dataSource = await initializeDataSource();
  const userRepository = _dataSource.getRepository(User);
  try {
    const isEmailUnique = emailExists(email);
    if (!isEmailUnique) {
      const customError = new CustomError(409, 'General', 'Conflict', ['Email already exists.']);
      return next(customError);
    }
    const user = new User();
    user.name = name;
    user.email = email;
    user.password = password;
    user.type = type;

    user.hashPassword();

    const userData = await userRepository.save(user);
    res.customSuccess(200, 'User successfully saved.', {
      id: userData.id,
      name: userData.name,
      email: userData.name,
    });
  } catch (err) {
    const customError = new CustomError(409, 'Raw', `User '${name}' can't be saved.`, null, err);
    return next(customError);
  }
};


/**
 * Checks if an email already exists in the database.
 *
 * @param email - The email address to check for existence.
 * @returns A promise that resolves to `true` if the email exists, otherwise `false`.
 */
const emailExists = async (email: string): Promise<boolean> => {
  const _dataSource = await initializeDataSource();
  const userRepository = _dataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });
  return !!user;
};
