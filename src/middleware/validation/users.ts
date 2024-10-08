import { ConstsUser, USER_TYPES } from 'consts/ConstsUser';
import { Request, Response, NextFunction } from 'express';
import { initializeDataSource } from 'orm/dbCreateConnection';

import { User } from 'orm/entities/User';
import { CustomError } from 'utils/response/custom-error/CustomError';
import { ErrorValidation } from 'utils/response/custom-error/types';
import validator from 'validator';

const validatePassword = (password: string): boolean => {
  const minLength = ConstsUser.PASSWORD_MIN_CHAR;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasDigits && hasSpecialChar;
};

export const validatorAdd = (req: Request, res: Response, next: NextFunction) => {
  let { name, email, type, password } = req.body;
  const errorsValidation: ErrorValidation[] = [];

  email = !email ? '' : email;
  password = !password ? '' : password;
  name = !name ? '' : name;
  type = !type ? '' : type;

  if (!validator.isEmail(email)) {
    errorsValidation.push({ email: 'Email is invalid' });
  }

  if (validator.isEmpty(email)) {
    errorsValidation.push({ email: 'Email is required' });
  }

  if (validator.isEmpty(password)) {
    errorsValidation.push({ password: 'Password is required' });
  }

  if (validatePassword(password)) {
    errorsValidation.push({
      password: `Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character`,
    });
  }

  if (validator.isEmpty(name)) {
    errorsValidation.push({ name: 'Name is required' });
  }

  if (validator.isEmpty(type)) {
    errorsValidation.push({ type: 'Type is required' });
  }

  if (!validator.isEmpty(type) && !USER_TYPES.includes(type)) {
    errorsValidation.push({ type: 'Invalid Type: only admin or user allowed' });
  }

  if (errorsValidation.length !== 0) {
    const customError = new CustomError(400, 'Validation', 'Register validation error', null, null, errorsValidation);
    return next(customError);
  }
  return next();
};

export const userAlreadyExist = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const errorsValidation: ErrorValidation[] = [];
  const _dataSource = await initializeDataSource();
  const userRepository = _dataSource.getRepository(User);

  if (!email) {
    errorsValidation.push({ email: `Email '${email}' is not passed but is mandatory` });
  }

  const user = await userRepository.findOneBy({ email });
  if (user) {
    errorsValidation.push({ email: `Email '${email}' already exists` });
  }

  if (errorsValidation.length !== 0) {
    const customError = new CustomError(400, 'Validation', 'User already exists', null, null, errorsValidation);
    return next(customError);
  }
  return next();
};
