import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

import { CustomError } from 'utils/response/custom-error/CustomError';
import { ErrorValidation } from 'utils/response/custom-error/types';

const checkIfEmpty = (value: string): boolean => {
  return validator.isEmpty(value) || value === undefined || value === null || value === '';
};

export const validatorTicket = (req: Request, res: Response, next: NextFunction) => {
  try {
    let { title, description, type, venue, status, price, priority, due_date, created_by } = req.body;
    const errorsValidation: ErrorValidation[] = [];

    title = !title ? '' : title;
    description = !description ? '' : description;
    type = !type ? '' : type;
    venue = !venue ? '' : venue;
    status = !status ? '' : status;
    price = !price ? -1 : price;
    priority = !priority ? '' : priority;
    due_date = !due_date ? '' : due_date;
    created_by = !created_by ? '' : created_by;

    if (checkIfEmpty(title)) {
      errorsValidation.push({ title: 'title is required' });
    }
    if (checkIfEmpty(description)) {
      errorsValidation.push({ description: 'description is required' });
    }
    if (checkIfEmpty(type)) {
      errorsValidation.push({ type: 'type is required' });
    }
    if (checkIfEmpty(venue)) {
      errorsValidation.push({ venue: 'venue is required' });
    }
    if (checkIfEmpty(status)) {
      errorsValidation.push({ status: 'status is required' });
    }
    if (!validator.isNumeric(price.toString()) || price < 0) {
      errorsValidation.push({ price: 'price should be numeric' });
    }
    if (checkIfEmpty(priority)) {
      errorsValidation.push({ priority: 'priority is required' });
    }
    if (checkIfEmpty(due_date)) {
      errorsValidation.push({ due_date: 'due_date is required' });
    }
    if (checkIfEmpty(created_by.toString())) {
      errorsValidation.push({ created_by: 'created_by is required' });
    }

    if (errorsValidation.length > 0) {
      const customError = new CustomError(400, 'Validation', 'Register validation error', null, null, errorsValidation);
      return next(customError);
    }
    return next();
  } catch (error) {
    console.trace('Ticket Validator Crashed!!', error);
    const customError = new CustomError(500, 'Raw', 'Ticket Validator Crashed!!', null, null, error);
    return next(customError);
  }
};
