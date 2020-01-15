import _ from 'lodash';

export enum ErrorType {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  SERVER_ERROR = 500,
}

const errorPriorities = [
  ErrorType.UNAUTHORIZED,
  ErrorType.FORBIDDEN,
  ErrorType.NOT_FOUND,
  ErrorType.CONFLICT,
  ErrorType.BAD_REQUEST,
  ErrorType.SERVER_ERROR,
];

export interface IError {
  field: string;
  msg: string;
}

export abstract class BaseError extends Error {
  public type: ErrorType;

  constructor(name: string, type: ErrorType, message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.type = type;
    this.message = message;
  }

  abstract get error(): IError[];

  public sendResponse(res: any) {
    res.status(this.type || 500).json({ errors: this.error });
  }
}

export class CustomError extends BaseError {
  private field: string;

  constructor(name: string, type: ErrorType, field: string, message: string) {
    super(name, type, message);

    this.field = field;
    this.message = message;
  }

  get error(): IError[] {
    return [{
      field: this.field,
      msg: this.message,
    }];
  }
}

export class ErrorCollection extends BaseError {
  private errors: BaseError[];

  constructor(type: ErrorType | undefined = undefined, ...errors: BaseError[]) {
    let evaluatedType: ErrorType;

    if (type !== undefined) {
      evaluatedType = type;
    } else {
      const priorities = errors.map(e => errorPriorities.indexOf(e.type)).filter(p => p >= 0);
      const highestError = _.min(priorities) || errorPriorities.indexOf(ErrorType.SERVER_ERROR);
      evaluatedType = errorPriorities[highestError];
    }

    super('ErrorCollection', evaluatedType, `${errors.length} errors.`);

    this.errors = errors;
  }

  get error() {
    return this.errors.reduce((errs, e) => {
      return [
        ...errs,
        ...e.error,
      ]
    }, [] as IError[]);
  }
}

export class SimpleError extends CustomError {
  constructor(message: string, type?: ErrorType) {
    super('SimpleError', type || ErrorType.SERVER_ERROR, '*', message);
  }
}

export class ServerError extends CustomError {
  constructor() {
    super('ServerError', ErrorType.SERVER_ERROR, '*', 'The server has encountered an error. See logs for more details.');
  }
}

export class MongooseError extends BaseError {
  private mongooseError: any;

  constructor(mongooseError: any) {
    super('MongooseError', ErrorType.BAD_REQUEST, 'Mongoose error');
    this.mongooseError = mongooseError;
  }

  get error() {
    const fieldErrors: IError[] = [];

    if (!this.mongooseError || !this.mongooseError.errors) {
      return fieldErrors;
    }

    for (const key in this.mongooseError.errors) {
      if (!this.mongooseError.errors.hasOwnProperty(key)) {
        continue;
      }

      fieldErrors.push({
        field: key,
        msg: this.mongooseError.errors[key].message,
      });
    }

    return fieldErrors;
  }
}

export class EventNotFoundError extends CustomError {
  constructor() {
    super('EventNotFoundError', ErrorType.NOT_FOUND, '*', 'No event was found with that id.');
  }
}

export class AlreadyExistsError extends CustomError {
  constructor(field: string, message: string) {
    super('AlreadyExistsError', ErrorType.CONFLICT, field, message);
  }
}

export const handleError = (error: BaseError | any, res: any): void => {
  if (error instanceof BaseError) {
    error.sendResponse(res);
    return;
  }

  if (error && error.errors) {
    // Mongoose validation? error
    new MongooseError(error).sendResponse(res);
    return;
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    new AlreadyExistsError('*', 'Duplicate item error.').sendResponse(res);
    return;
  }

  // TODO: log to file and/or database
  console.warn('Error with request.');
  console.warn('Request info:');
  console.warn(JSON.stringify({
    headers: res.req.headers,
    url: res.req.url,
    method: res.req.method,
    params: res.req.params,
    query: res.req.query,
    body: res.req.body,
    authUser: res.req.authUser,
    route: res.req.route,
  }));
  console.warn();
  console.warn('Error:');
  console.warn(error);

  new ServerError().sendResponse(res);
};
