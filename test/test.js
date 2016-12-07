var elasticsearch = require('elasticsearch'),
  app = require('../index'),
  promisify = require("es6-promisify"),
  co = require('co'),
  should = require('should');

var client = new elasticsearch.Client({
  host: process.env.ELASTIC_DOMAIN,
  requestTimeout: 10 * 1000
});

describe('0-START', function () {
  "use strict";

  describe('Basic logging', function () {
    it('should return word public', function (done) {
      let logging = new app.BasicLogging(client);
      co(logging.ok('test', 'event name', {originalUrl: 'passed test', method: 'GET', body: {a: 1, c: 2}})).then((res)=> {
        if(res.error) {
          done(res);
        } else {
          done();
        }
      }).catch((err) => {
        done(err);
      })
    })
  });

  describe('Endpoint logging', function () {
    it('should be fine', function (done) {
      let logging = new app.EndpointLogging(client);
      co(logging.ok('test', 'GET', '/passed-test?query=dd#asdda', {header1: 1, header2: 2}, 10, 200, 133)).then((res)=> {
        if(res.error) {
          done(res);
        } else {
          done();
        }
      }).catch((err) => {
        done(err);
      })
    })
  });
  let logging = new app.EndpointLogging(client);
  describe('Endpoint logging', function () {
    it('should write an error to console or send email', function (done) {
      co(logging.ok({originalUrl: 'passed test', body: {a: 1, c: 2}})).then((res)=> {
        if(res.error) {
          console.log(res.error)
          done()
        } else {
          done(res);
        }
      }).catch((err) => {
        done(err);
      })
    })
  });

  describe('Endpoint logging', function () {
    it('shouldn\'t send email', function (done) {
      co(logging.ok({originalUrl: 'passed test', body: {a: 1, c: 2}})).then((res)=> {
        if(res.error) {
          console.log(res.error)
          done()
        } else {
          done(res);
        }
      }).catch((err) => {
        done(err);
      })
    })
  });
});
