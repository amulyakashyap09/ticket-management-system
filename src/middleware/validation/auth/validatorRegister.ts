import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

import { ConstsUser, USER_TYPES } from 'consts/ConstsUser';
import { CustomError } from 'utils/response/custom-error/CustomError';
import { ErrorValidation } from 'utils/response/custom-error/types';

const validatePassword = (password: string): boolean => {
  const minLength = ConstsUser.PASSWORD_MIN_CHAR;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasDigits && hasSpecialChar;
};

export const validatorRegister = (req: Request, res: Response, next: NextFunction) => {
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
