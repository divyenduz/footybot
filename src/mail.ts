import * as dotenv from "dotenv";
const sgMail = require("@sendgrid/mail");

dotenv.config();

const SEND_EMAILS = process.env.SEND_EMAILS;
const SENDGRID_KEY = process.env.SENDGRID_KEY;

sgMail.setApiKey(SENDGRID_KEY);

export function sendMail({ subject, body, to = "divyendu.z@gmail.com" }) {
  const msg = {
    to,
    from: "ai@zoid.in"
  };
  const content = {
    ...msg,
    subject,
    html: body
  };
  if (SEND_EMAILS === "true") {
    sgMail.send(content);
  } else {
    console.log(`Sending email is disabled: `, content);
  }
}
