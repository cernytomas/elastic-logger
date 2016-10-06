'use strict';
let nodemailer = require('nodemailer'),
  promisify = require("es6-promisify"),
  moment = require('moment');

class BasicLogging {

  constructor(elastic) {
    this.elastic = elastic;
  }

  * ok(type, event, data) {
    yield this.write({
      index: 'logs-week-' + moment().isoWeek(),
      type: type,
      body: {
        timestamp: new Date(),
        event: event,
        status: 'ok',
        body: JSON.stringify(data) || ''
      }
    });
  }

  * error(type, event, err) {
    yield this.write({
      index: 'logs-week-' + moment().isoWeek(),
      type: type,
      body: {
        timestamp: new Date(),
        event: event,
        status: 'error',
        error: {message: err.message || '', stack: err.stack || {}}
      }
    });
  }

  * write(options) {
    try {
      yield this.elastic.create(options);
    } catch (e) {
      yield sendErrorEmail(e);
    }
  }


}

class EndpointLogging extends BasicLogging {

  * ok(type, request) {
    yield super.write({
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
  }

  * error(type, request, err) {
    yield super.write({
      index: 'logs-week-' + moment().isoWeek(),
      type: type,
      body: {
        timestamp: new Date(),
        method: request.method,
        endpoint: request.originalUrl,
        status: 'error',
        request: request,
        error: {message: err.message || '', stack: err.stack || {}}
      }
    });
  }
}
module.exports = {BasicLogging, EndpointLogging};

function * sendErrorEmail(err) {
  try {
    var transporter = nodemailer.createTransport('smtps://' + process.env.MAIL_USER + ':' + process.env.MAIL_PASS + '@' + process.env.MAIL_SMTP_SERVER + '');
    var sendMail = promisify(transporter.sendMail.bind(transporter));
    yield sendMail({
      to: process.env.ERROR_ADDRESS,
      subject: 'An Error occurred',
      content: JSON.stringify(err) + ' ' + err.stack ? JSON.stringify(err.stack) : ''
    })
  } catch (e) {
    console.error(e)
  }
}