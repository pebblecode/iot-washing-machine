var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');
var config = require('./config');

console.log(config.gmailAuth);

var generator = xoauth2.createXOAuth2Generator(config.gmailAuth);

// listen for token updates (if refreshToken is set)
// you probably want to store these to a db
generator.on('token', function(token) {
  console.log('New token for %s: %s', token.user, token.accessToken);
});

// login
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    xoauth2: generator
  }
});

// setup e-mail data with unicode symbols
var mailOptions = {
  from: '"Whistle" <ssnxg7@gmail.com>', // sender address
  to: 'simon.white@pebblecode.com', // list of receivers
  subject: 'Whistle Notification', // Subject line
  text: 'Washing machine finished!', // plaintext body
  html: '<b>Washing machine finished!</b>' // html body
};

exports.send = send;

// send();

// send mail with defined transport object
function send() {
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}
