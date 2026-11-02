// Email from the business Gmail account. The Gmail App Password lives in
// Google Secret Manager: firebase functions:secrets:set GMAIL_APP_PASSWORD
// Functions that send mail list GMAIL_APP_PASSWORD in their `secrets`.
import { defineSecret } from "firebase-functions/params";
import nodemailer from "nodemailer";

export const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
export const GMAIL_USER = "jj.backyardbrickoven@gmail.com";

// message: { to, subject, text, html?, replyTo? }
export const sendMail = (message) =>
  nodemailer
    .createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.value() } })
    .sendMail({ from: `"Backyard Brick Oven" <${GMAIL_USER}>`, ...message });
