const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'asnatm01@gmail.com', 
    pass: 'degc jalb wnoo tqkq'
  }
});
module.exports = transporter;
