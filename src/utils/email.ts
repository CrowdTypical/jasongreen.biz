import nodemailer from 'nodemailer';

export function createEmailTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'spreadthefund@gmail.com',
      pass:
        import.meta.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD,
    },
  });
}
