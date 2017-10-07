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
    const schema = object().keys({
      str: string(),
      num: number(),
      optStr: string().optional(),
      forbStr: string().forbidden(),
    });

    const validProcessEnv = {
      ENV: 'production',
      SERVICE_NAME: 'foo',
      TENANT: 'multi',
      str: 'bar',
      num: '2',
      optStr: 'foofoo',
    };

    it('accepts a string', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(validProcessEnv);

      assert.doesNotThrow(() => getEnv('str'));
    });

    it('returns the value of the environment variable from process.env, properly coerced', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(validProcessEnv);

      assert.equal(getEnv('str'), 'bar');
      assert.equal(getEnv('num'), 2);
    });

    it('returns the value of optional environment variables', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(validProcessEnv);

      assert.equal(getEnv('optStr'), 'foofoo');
    });

    it('throws if requested environment variable is not defined in schema', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(validProcessEnv);

      assert.throws(() => getEnv('baz'));
    });

    it('throws if any variable in process.env cannot be coerced to the correct type', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { num: 'two' }));

      assert.throws(() => getEnv('str'));
    });

    it('strips unknown environment variables', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ foo: 'barbar' }, validProcessEnv));

      assert.throws(() => getEnv('foo'));
    });

    it('throws if process.env is missing environment variables in schema', function() {
      const missingEnv = Object.assign({}, validProcessEnv);
      delete missingEnv.str;
      const getEnv = tsEnv(schema);
      getEnv.setEnv(missingEnv);

      assert.throws(() => getEnv('ENV'));
    });

    it('does not throw if optional environment variables in schema are not in process.env', function() {
      const optMissingEnv = Object.assign({}, validProcessEnv);
      delete optMissingEnv.foofoo;
      const getEnv = tsEnv(schema);
      getEnv.setEnv(optMissingEnv);

      assert.doesNotThrow(() => getEnv('ENV'));
    });

    it('throws if forbidden environment variables in schema are in process.env', function() {
      const getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ forbStr: 'bar' }, validProcessEnv));

      assert.throws(() => getEnv('str'));
    });

    it('does not obey default values set in the schema', function() {
      const getEnv = tsEnv(schema.keys({ str: string().default('baz') }));
      getEnv.setEnv(validProcessEnv);

      assert.notEqual(getEnv('str'), 'baz');
      assert.equal(getEnv('str'), 'bar');
    });

    it('requires process.env.NODE_ENV to equal \'test\', \'local\', \'demo\', \'development\', \'staging\', \'production\'', function() {
      let getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'foo' }));
      assert.throws(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'test' }));
      assert.doesNotThrow(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'local' }));
      assert.doesNotThrow(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'demo' }));
      assert.doesNotThrow(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'development' }));
      assert.doesNotThrow(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'staging' }));
      assert.doesNotThrow(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { ENV: 'production' }));
      assert.doesNotThrow(() => getEnv('str'));
    });

    it('requires process.env.SERVICE_NAME to be a non-empty string', function() {
      let getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { SERVICE_NAME: '' }));
      assert.throws(() => getEnv('str'));

      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { SERVICE_NAME: 'foo' }));
      assert.doesNotThrow(() => getEnv('str'));
    });

    it('requires process.env.TENANT to be a non-empty string', function() {
      let getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { TENANT: '' }));
      assert.throws(() => getEnv('str'));


      getEnv = tsEnv(schema);
      getEnv.setEnv(Object.assign({ }, validProcessEnv, { TENANT: 'foo' }));
      assert.doesNotThrow(() => getEnv('str'));
    });
  });
});
