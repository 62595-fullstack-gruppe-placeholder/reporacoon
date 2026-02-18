// this is just a test file to verify that nodemailer works correctly with Ethereal. 
// It is not meant to be run in production or used as part of the actual mailer implementation .
// aka please ignore 


import nodemailer from "nodemailer";

async function main() {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"My App" <no-reply@myapp.com>',
    to: "test@example.com",
    subject: "Test email",
    html: "<h1>Hello!</h1><p>This is a test.</p>",
  });

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

main();