import { IError } from './errors';

const isValidString = (value: string, min: number = 0, max: number = Infinity) => {
  if (!value || typeof value !== 'string') return false;
  return value.length >= min && value.length <= max;
}

const isValidEmail = (value: string) => {
  if (!isValidString(value, 4)) return false;

  // tslint:disable-next-line:max-line-length
  const res = value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

  return Boolean(res && res.length && res.length > 0);
};

const isValidPassword = (value: string) => isValidString(value, 6);

const isValidId = (value: string) => {
  if (!isValidString(value, 24, 24)) return false;

  const res = value.match(/^[0-9a-f]{24}$/);

  return Boolean(res && res.length && res.length === 1);
};

const isValidBirthdate = (value: Date) => {
  if (!value || !(value instanceof Date)) return false;

  const age = (new Date().getTime() - value.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return (age >= 18 && age < 120);
};

interface IValidationData {
  [field: string]: any;
}

interface IValidation {
  field: string;
  validator: (value: any) => boolean;
  msg?: string;
  optional?: boolean;
}

const validate = (data: IValidationData, validations: IValidation[]) => validations.reduce((res, val) => {
  const value = data[val.field];

  if (value === undefined) {
    if (val.optional === true) return res;
  } else if (val.validator(data[val.field])) return res;

  return [
    ...res,
    {
      field: val.field,
      msg: val.msg || `Please enter a valid ${val.field}.`,
    },
  ];
}, [] as IError[]);

const factory = {
  isValidString,
  isValidEmail,
  isValidPassword,
  isValidId,
  isValidBirthdate,
  validate,
};

export default factory;
