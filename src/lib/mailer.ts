import nodemailer from 'nodemailer'

if (!process.env.SMTP_HOST) {
  throw new Error('Missing SMTP_HOST environment variable')
}
if (!process.env.SMTP_USER) {
  throw new Error('Missing SMTP_USER environment variable')
}
if (!process.env.SMTP_PASS) {
  throw new Error('Missing SMTP_PASS environment variable')
}

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})
