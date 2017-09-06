'use strict';

/* eslint-disable no-process-env */

var Joi = require('joi');

var string = Joi.string;
var object = Joi.object;

module.exports = function(schema) {
  Joi.assert(schema, object().schema().required());

  var fullSchema = schema.keys(
    {
      SERVICE_NAME: string(),
      ENV: string().valid(['test', 'local', 'demo', 'ci', 'staging', 'production']),
      TENANT: string(),
    }
  );

  var res = Joi.validate(
    process.env,
    fullSchema,
    {
      stripUnknown: true,
      noDefaults: true,
      presence: 'required',
    }
  );

  var error = res.error;
  var value = res.value;

  Object.freeze(value);

  // set process.env.NODE_ENV to production by default in case express or anything else needs it
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  return function getEnv(variable) {
    if (error) throw error;

    if (!Joi.reach(fullSchema, variable)) {
      throw new Error("Requested environment variable" + variable + " not found");
    }

    return value[variable];
  };
};
