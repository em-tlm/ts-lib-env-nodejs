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
      ENV: string().valid(['test', 'local', 'demo', 'development', 'staging', 'production']),
      TENANT: string(),
    }
  );

  let env;
  let validationResult;

  const getEnv = function getEnv(variable) {
    if (!validationResult) {
      Joi.assert(env, object().required(), 'Env must be set through .setEnv prior to use');

      validationResult = Joi.validate(
        env,
        fullSchema,
        {
          stripUnknown: true,
          noDefaults: true,
          presence: 'required',
        }
      );

      Object.freeze(validationResult);

      // set process.env.NODE_ENV to production by default in case express or anything else needs it
      process.env.NODE_ENV = env.NODE_ENV || process.env.NODE_ENV || 'production';
    }

    if (validationResult.error) throw validationResult.error;

    if (!Joi.reach(fullSchema, variable)) {
      throw new errors.ValidationError(`Requested environment variable "${variable}" not found`);
    }

    return validationResult.value[variable];
  };

  getEnv.setEnv = (e) => {
    env = e;
    validationResult = null;
  };

  return getEnv;
};
