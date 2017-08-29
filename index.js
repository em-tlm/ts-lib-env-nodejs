'use strict';

/* eslint-disable no-process-env */

const Joi = require('joi');

const { string, object } = Joi;

module.exports = (schema) => {
  Joi.assert(schema, object().required());

  const fullSchema = Object.assign(
    {},
    schema,
    {
      SERVICE_NAME: string(),
      NODE_ENV: string().valid(['test', 'development', 'production']),
    }
  );

  const { error, value } = Joi.validate(
    process.env,
    object().keys(fullSchema),
    {
      stripUnknown: true,
      noDefaults: true,
      presence: 'required',
    }
  );

  Object.freeze(value);

  return function getEnv(variable) {
    if (error) throw error;
    Joi.assert(
      variable,
      string().valid(Object.keys(fullSchema)).required(),
      'Requested environment variable not found'
    );

    return value[variable];
  };
};
