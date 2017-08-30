'use strict';

/* eslint-disable no-process-env */

const { assert } = require('chai');

const Joi = require('joi');

const { string, number, object } = Joi;

const tsEnv = require('../index');

describe('tsEnv', function() {
  it('accepts a Joi schema object', function() {
    assert.throws(() => tsEnv());
    assert.throws(() => tsEnv('string'));
    assert.throws(() => tsEnv({}));
    assert.doesNotThrow(() => tsEnv(object()));
    assert.doesNotThrow(() => tsEnv(object({ str: string() })));
  });
  it('returns a function "getEnv"', function() {
    const returnVal = tsEnv(object({ str: string() }));

    assert.instanceOf(returnVal, Function);
    assert.equal(returnVal.name, 'getEnv');
  });

  describe('getEnv', function() {
    const env = Object.assign({}, process.env);

    afterEach(() => {
      process.env = {};
    });

    after(() => {
      process.env = env;
    });

    const schema = object().keys({
      str: string(),
      num: number(),
      optStr: string().optional(),
      forbStr: string().forbidden(),
    });

    const validProcessEnv = {
      NODE_ENV: 'test',
      SERVICE_NAME: 'foo',
      str: 'bar',
      num: '2',
      optStr: 'foofoo',
    };

    it('accepts a string', function() {
      process.env = validProcessEnv;
      const getEnv = tsEnv(schema);

      assert.doesNotThrow(() => getEnv('str'));
    });

    it('returns the value of the environment variable from process.env, properly coerced', function() {
      process.env = validProcessEnv;
      const getEnv = tsEnv(schema);

      assert.equal(getEnv('str'), 'bar');
      assert.equal(getEnv('num'), 2);
    });

    it('returns the value of optional environment variables', function() {
      process.env = validProcessEnv;
      const getEnv = tsEnv(schema);

      assert.equal(getEnv('optStr'), 'foofoo');
    });

    it('throws if requested environment variable is not defined in schema', function() {
      process.env = validProcessEnv;
      const getEnv = tsEnv(schema);

      assert.throws(() => getEnv('baz'));
    });

    it('throws if any variable in process.env cannot be coerced to the correct type', function() {
      process.env = Object.assign({ }, validProcessEnv, { num: 'two' });
      const getEnv = tsEnv(schema);

      assert.throws(() => getEnv('str'));
    });

    it('strips unknown environment variables', function() {
      process.env = Object.assign({ foo: 'barbar' }, validProcessEnv);
      const getEnv = tsEnv(schema);

      assert.throws(() => getEnv('foo'));
    });

    it('throws if process.env is missing environment variables in schema', function() {
      const missingEnv = Object.assign({}, validProcessEnv);
      delete missingEnv.str;
      process.env = missingEnv;
      const getEnv = tsEnv(schema);

      assert.throws(() => getEnv('NODE_ENV'));
    });

    it('does not throw if optional environment variables in schema are not in process.env', function() {
      const optMissingEnv = Object.assign({}, validProcessEnv);
      delete optMissingEnv.foofoo;
      process.env = optMissingEnv;
      const getEnv = tsEnv(schema);

      assert.doesNotThrow(() => getEnv('NODE_ENV'));
    });

    it('throws if forbidden environment variables in schema are in process.env', function() {
      process.env = Object.assign({ forbStr: 'bar' }, validProcessEnv);
      const getEnv = tsEnv(schema);

      assert.throws(() => getEnv('str'));
    });

    it('does not obey default values set in the schema', function() {
      process.env = validProcessEnv;
      const getEnv = tsEnv(schema.keys({ str: string().default('baz') }));

      assert.notEqual(getEnv('str'), 'baz');
      assert.equal(getEnv('str'), 'bar');
    });

    it('requires process.env.NODE_ENV to equal test, development, or production', function() {
      process.env = Object.assign({ }, validProcessEnv, { NODE_ENV: 'foo' });
      let getEnv = tsEnv(schema);
      assert.throws(() => getEnv('str'));

      process.env = Object.assign({ }, validProcessEnv, { NODE_ENV: 'test' });
      getEnv = tsEnv(schema);
      assert.doesNotThrow(() => getEnv('str'));

      process.env = Object.assign({ }, validProcessEnv, { NODE_ENV: 'development' });
      getEnv = tsEnv(schema);
      assert.doesNotThrow(() => getEnv('str'));

      process.env = Object.assign({ }, validProcessEnv, { NODE_ENV: 'production' });
      getEnv = tsEnv(schema);
      assert.doesNotThrow(() => getEnv('str'));
    });

    it('requires process.env.SERVICE_NAME to be a non-empty string', function() {
      process.env = Object.assign({ }, validProcessEnv, { SERVICE_NAME: '' });
      let getEnv = tsEnv(schema);
      assert.throws(() => getEnv('str'));

      process.env = Object.assign({ }, validProcessEnv, { SERVICE_NAME: 'foo' });
      getEnv = tsEnv(schema);
      assert.doesNotThrow(() => getEnv('str'));
    });
  });
});
