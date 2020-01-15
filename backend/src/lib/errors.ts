export interface IError {
  field: string;
  msg: string;
}

const factory = {} as any;

factory.notFoundError = (type: string = 'element') => ({
  status: 404,
  errors: [
    { msg: `No ${type} exists with that id.` },
  ],
});

factory.noUserError = factory.notFoundError('user');

factory.emailPasswordError = {
  status: 403,
  errors: [
    { field: '*',
      msg: 'Invalid email or password.' },
  ],
};

factory.noPermissionError = {
  status: 403,
  errors: [
    { msg: 'You don\'t have permission to do that!' },
  ],
};

factory.noContentError = factory.notFoundError('content');

factory.simpleError = (msg: string, status: number = 500) => ({
  status,
  errors: [ { msg } ],
});

factory.formatMongooseErrors = (error: any) => {
  const fieldErrors: IError[] = [];

  if (!error || !error.errors) {
    return fieldErrors;
  }

  for (const key in error.errors) {
    if (!error.errors.hasOwnProperty(key)) {
      continue;
    }

    fieldErrors.push({
      field: key,
      msg: error.errors[key].message,
    });
  }

  return fieldErrors;
};

factory.handleError = (error: any, res: any) => {
  if (error && error.errors) {
    if (error.errors.length) {
      return res.status(error.status || 500).json({ errors: error.errors });
    } else {
      // Mongoose validation? error
      return res.status(400).json({ errors: factory.formatMongooseErrors(error) });
    }
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    return factory.handleError(factory.simpleError('Duplicate item error.', 400), res);
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
  factory.handleError(factory.simpleError('The server has encountered an error. See logs for more details.'), res);
};

export default factory;
