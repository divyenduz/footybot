import * as dotenv from 'dotenv'
const sgMail = require('@sendgrid/mail')

export function sendMail({ subject, body, to = 'divyendu.z@gmail.com' }) {
  dotenv.config()

  const SEND_EMAILS = process.env.SEND_EMAILS
  console.log({ SEND_EMAILS })
  const SENDGRID_KEY = process.env.SENDGRID_KEY

  sgMail.setApiKey(SENDGRID_KEY)

  const msg = {
    to: to || 'divyendu.z@gmail.com',
    from: 'ai@zoid.in',
  }
  const content = {
    ...msg,
    subject,
    html: body,
  }
  console.log({ content })
  if (SEND_EMAILS === 'true') {
    sgMail.send(content)
  } else {
    console.log(`Sending email is disabled: `, content)
  }
}
