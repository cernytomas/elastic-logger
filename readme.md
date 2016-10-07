# Simple logger to Elasticsearch 
## Features
success logging

error logging

ready for REST API logging (use EndpointLogger)

Elasticsearch errors durable

Sends emails, when elastic error happens. Maximum is one email per quota (By default 5 minutes)

If email connection is not available, print error to error.log


# Install
``
npm install
``

# Environment variables
MAIL_USER - smtp user

MAIL_PASS - smtp pass

MAIL_SMTP_SERVER - smtp host IP or URL

ERROR_ADDRESS - email address to send error emails 

ERROR_INTERVAL - (number) in minutes. interval of error messages sending. Default is 5 minutes


# Usage
```javascript
let elasticsearch = require('elasticsearch'),
    logger = require('elastic-logger');
    
let client = new elasticsearch.Client({
      host: process.env.ELASTIC_DOMAIN,
      requestTimeout: 100 * 1000
    });
let log = new BasicLogger(client);

try {
    undefined_var
} catch (err) {
    log.error('my-testing-app', 'first method', err)
}

```

# Test

``
npm test
``
