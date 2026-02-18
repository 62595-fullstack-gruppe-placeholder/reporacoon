import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // creates one-time Ethereal test account, prolly fine for proof of concept 
  // might need to be swapped out for real SMTP creds in production
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: '"My App" <no-reply@myapp.com>',
    to,
    subject,
    html,
  });

  //logs the Ethereal preview URL
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

  return info;
}