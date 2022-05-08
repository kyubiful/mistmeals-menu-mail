const nodemailer = require('nodemailer')
require('dotenv').config()


let transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE,
  auth: {
    user: process.env.MAIL_AUTH_USER,
    pass: process.env.MAIL_AUTH_PASSWORD,
  }
})

let mailOptions = {
  from: `MistMeals <${process.env.MAIL_AUTH_USER}>`,
  to: '',
  subject: '',
  html: '',
  attachments: [
    {
      filename: 'menu.pdf',
      path: __dirname+'/output/output.pdf'
    }
  ]
}

module.exports = {
  transporter,
  mailOptions
}
