'use strict';
let nodemailer = require('nodemailer'),
  promisify = require("es6-promisify"),
  moment = require('moment');
let lastEmailDate = moment().subtract(7, 'days');

class BasicLogging {

  constructor(elastic) {
    this.elastic = elastic;
  }

  * ok(type, event, data) {
    try {
      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          event: event,
          status: 'ok',
          body: JSON.stringify(data) || ''
        }
      });
    } catch (e) {
      return yield sendErrorEmail(e);
    }
    return {ok: true}
  }

  * error(type, event, err) {
    try {

      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          event: event,
          status: 'error',
          error: {message: err.message || '', stack: JSON.stringify(err.stack) || ''}
        }
      });
    } catch (e) {
      return yield sendErrorEmail(e);
    }
    return {ok: true}
  }
}

class EndpointLogging extends BasicLogging {

  * ok(type, request) {
    try {
      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          method: request.method,
          endpoint: request.originalUrl,
          status: 'ok',
          body: JSON.stringify(request.body) || ''
        }
      });
    } catch (e) {
      return yield sendErrorEmail(e);
    }
    return {ok: true}
  }

  * error(type, request, err) {
    try {
      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          method: request.method,
          endpoint: request.originalUrl,
          status: 'error',
          request: request,
          error: {message: err.message || '', stack: JSON.stringify(err.stack) || ''},
          body: JSON.stringify(request.body) || ''
        }
      });
    } catch (e) {
      return yield sendErrorEmail(e);
    }
    return {ok: true}
  }
}
module.exports = {BasicLogging, EndpointLogging};

function * sendErrorEmail(err) {
  try {
    if(moment().diff(lastEmailDate, 'minutes') > process.env.ERROR_INTERVAL || 5) {
      lastEmailDate = moment();
      var transporter = nodemailer.createTransport('smtps://' + process.env.MAIL_USER + ':' + process.env.MAIL_PASS + '@' + process.env.MAIL_SMTP_SERVER + '');
      var sendMail = promisify(transporter.sendMail.bind(transporter));
      yield sendMail({
        to: process.env.ERROR_ADDRESS,
        from: process.env.MAIL_USER,
        subject: 'An Error occurred',
        text: JSON.stringify(err) + ' ' + (err.stack ? JSON.stringify(err.stack) : '')
      });
    }
    return {error: 'sent via email'}
  } catch (e) {
    console.error(err);
    return {error: 'print out to error log'}
  }
}