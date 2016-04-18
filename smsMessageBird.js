var config = require('./config');
var messagebird = require('messagebird')(config.messageBirdAuth.ACCESS_KEY);

var messageBodies = [
  'Washing machine finished!',
  'Time to get drying',
  'Stop! Drying time...',
  'Hi ho Hi ho, it\'s off to dry we go!'
];

exports.send = send;

// getBalance();
// send();

function send() {
  var index = Math.floor(Math.random() * messageBodies.length);

  var params = {
    'originator': 'Whistle',
    'recipients': [
      config.mobileNumbers.SW
      // config.mobileNumbers.EN
    ],
    'body': 'Washing machine finished!'
    // 'body': messageBodies[index]
  };

  messagebird.messages.create(params, function (err, response) {
    if (err) {
      return console.log(err);
    }
    console.log(response);
  });
}

function getBalance() {
  messagebird.balance.read(function (err, data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  });
}
