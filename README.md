# ts-lib-env-nodejs

A simple library for validating and accessing environment variables in Node.js (v6.0 or later) programs:

* ensures that your program only runs when all of its environment dependencies are met
  * while providing a path to write unit tests that run without setting the environment
* assigns sole responsibility of setting environment variables to the environment itself
  * via process.env
  * sets process.env.NODE_ENV to 'production' if it is not set, however, because some 3rd-party libraries might use it for magic
* provides executable documentation about the environment your program expects to run in
  * requires by default expected Tetrascience environment variables
* exposes an immutable API for accessing your environment variables
* ensures that typos when accessing environment variable access won't continue silently and cause code to fail in unexpected ways

## Installation

```sh
$ yarn install tetrascience/ts-lib-env-nodejs
```

## Usage

```javascript
const { string, number, boolean, object } = require('joi');
const tsEnv = require('ts-env');

// uses Joi schemas
const schema = object({
  VAR_ONE: string(),
  VAR_TWO: number().optional(),
  VAR_THREE: boolean().optional(),
});

// process.env should already be set by environment

// for ex, assume process.env is { VAR_ONE: 'foo', VAR_TWO: '2', ENV: 'production', SERVICE_NAME: 'bar', TENANT: 'multi' }

const getEnv = tsEnv(schema); // always succeeds if schema itself is a valid Joi schema

// module.exports = getEnv;

// returns properly coerced value for allowed environment variables
getEnv('VAR_ONE'); // 'foo'
getEnv('VAR_TWO'); // 2
getEnv('VAR_THREE'); // undefined
getEnv('SERVICE_NAME'); // 'bar'

// throws if disallowed variable is requested
getEnv('VAR_NOT_IN_SCHEMA'); // Uncaught Error ....

// also throws if contents of process.env had failed validation in any way
// for ex, getEnv(...) would always throw if process.env was { VAR_NONE: 'foo' }
```

### Standard Tetrascience environment variables (required regardless of schema)
* ENV
  * allowed values: 'test', 'local', 'demo', 'ci', 'staging', 'production'
* TENANT
  * allowed values: any string
* SERVICE_NAME
  * allowed values: any string ('multi', 'customer-1', 'customer-2')

## Testing

* To run tests: `yarn test`
* To add tests, simply add appropriate files with mocha tests to the /test directory
  * You can add subfolders for appropriate structure without doing anything special. This should just work.
