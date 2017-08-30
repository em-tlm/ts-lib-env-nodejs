'use strict';

/* eslint-disable no-process-env */

const Joi = require('joi');
const errors = require('ts-errors');

const { string, object } = Joi;

module.exports = (schema) => {
  Joi.assert(schema, object().schema().required());

  const fullSchema = schema.keys(
    {
      SERVICE_NAME: string(),
      NODE_ENV: string().valid(['test', 'development', 'production']),
    }
  );

  const { error, value } = Joi.validate(
    process.env,
    fullSchema,
    {
      stripUnknown: true,
      noDefaults: true,
      presence: 'required',
    }
  );

  Object.freeze(value);

  return function getEnv(variable) {
    if (error) throw error;

    if (!Joi.reach(fullSchema, variable)) {
      throw new errors.ValidationError(`Requested environment variable "${variable}" not found`);
    }

    return value[variable];
  };
};
