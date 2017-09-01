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
      ENV: string().valid(['test', 'local', 'demo', 'ci', 'staging', 'production']),
      TENANT: string(),
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

  // set process.env.NODE_ENV to production by default in case express or anything else needs it
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  return function getEnv(variable) {
    if (error) throw error;

    if (!Joi.reach(fullSchema, variable)) {
      throw new errors.ValidationError(`Requested environment variable "${variable}" not found`);
    }

    return value[variable];
  };
};
