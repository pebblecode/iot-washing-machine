var config = require('./config');
var client = require('twilio')(config.twilioAuth.ACCOUNT_SID, config.twilioAuth.AUTH_TOKEN);

exports.send = send;

// send();

function send() {
  client.messages.create({
    body: "Whistle! Washing machine finished!",
    to: config.mobileNumbers.SW,
    // to: config.mobileNumbers.EN,
    from: "+441727260189"
  }, function(error, message) {
    if (error) {
      console.log('error:' + error.message);
    }

    console.log(message);
  });
}
