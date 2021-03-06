'use strict';
const nodemailer = require('nodemailer'),
  promisify = require("es6-promisify"),
  moment = require('moment'),
  url = require('url');
var lastEmailDate = moment().subtract(7, 'days');

class BasicLogging {

  constructor(elastic) {
    this.elastic = elastic;
  }

  /**
   *
   * @param type
   * @param event
   * @param data object - raw_data: saved as json. Has to have unified structure foreach "type"
   *                    - stringified_data: saved as string
   * @returns {*}
   */
  * ok(type, event, data) {
    try {
      if(data && data.stringified_data) {
        data.stringified_data = JSON.stringify(data.stringified_data);
      }
      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          event: event,
          status: 'ok',
          data: data
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

  * ok(type, method, urlAddress, headers, responseSize, responseCode, responseTime) {
    try {
      let parsed = url.parse(urlAddress);
      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          method: method,
          endpoint: parsed.pathname,
          url: parsed,
          status: 'ok',
          request: {headers: headers},
          response: {
            code: responseCode,
            size: responseSize,
            time: responseTime
          }
        }
      });
    } catch (e) {
      return yield sendErrorEmail(e);
    }
    return {ok: true}
  }

  * error(type, request, err, responseSize, responseCode, responseTime) {
    try {
      let parsed = url.parse(request.originalUrl);
      yield this.elastic.create({
        index: 'logs-week-' + moment().isoWeek(),
        type: type,
        body: {
          timestamp: new Date(),
          method: request.method,
          endpoint: parsed.pathname,
          url: parsed,
          status: 'error',
          request: request,
          error: {message: err.message || '', stack: JSON.stringify(err.stack) || ''},
          body: JSON.stringify(request.body) || '',
          response: {
            code: responseCode,
            size: responseSize,
            time: responseTime
          }
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
    if(moment().diff(lastEmailDate, 'minutes') > (process.env.ERROR_INTERVAL || 5)) {
      lastEmailDate = moment();
      let transporter = nodemailer.createTransport('smtps://' + process.env.MAIL_USER + ':' + process.env.MAIL_PASS + '@' + process.env.MAIL_SMTP_SERVER + '');
      let sendMail = promisify(transporter.sendMail.bind(transporter));
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
