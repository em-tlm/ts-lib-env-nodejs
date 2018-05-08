'use strict';

/* eslint-disable no-process-env */

const Joi = require('joi');
const errors = require('ts-errors');

module.exports = (schema) => {
  Joi.assert(schema, Joi.object().schema().required());

  const fullSchema = schema.keys(
    {
      SERVICE_NAME: Joi.string(),
      ENV: Joi.string().valid(['test', 'local', 'demo', 'development', 'staging', 'production']),
      TENANT: Joi.string(),
    }
  );

  let env;
  let validationResult;
  let testMode;

  const getEnv = function getEnv(variable) {
    if (!validationResult) {
      Joi.assert(env, Joi.object().required(), 'Env must be set through .setEnv prior to use');

      validationResult = Joi.validate(
        env,
        fullSchema,
        {
          stripUnknown: true,
          presence: 'required',
          abortEarly: false,
        }
      );

      Object.freeze(validationResult);

      // set process.env.NODE_ENV to production by default in case express or anything else needs it
      process.env.NODE_ENV = env.NODE_ENV || process.env.NODE_ENV || 'production';
    }

    if (validationResult.error) {
      if (testMode) {
        const variableValidationError = validationResult.error.details.find(
          detail => Array.isArray(detail.path)
            ? detail.path.includes(variable)
            : detail.path === variable
        );
        if (variableValidationError) {
          throw new errors.ValidationError(
            variableValidationError.message,
            variableValidationError
          );
        }
      } else {
        throw validationResult.error;
      }
    }

    if (!Joi.reach(fullSchema, variable)) {
      throw new errors.ValidationError(`Requested environment variable "${variable}" not found`);
    }

    return validationResult.value[variable];
  };

  getEnv.setEnv = (e) => {
    env = e;
    validationResult = null;
  };

  getEnv.enterTestMode = (e) => {
    getEnv.setEnv(e);
    testMode = true;
  };

  return getEnv;
};
