const nodemailer = require("nodemailer");

let transporterPromise;

const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
};

const sendVerificationEmail = async ({ to, token }) => {
  const transporter = await getTransporter();
  const verifyUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/api/auth/verify-email?token=${token}`;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@crud-api.local",
    to,
    subject: "Verify your email",
    html: `
      <h2>Welcome!</h2>
      <p>Please verify your email to activate your account.</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>If the button does not work, use this URL:</p>
      <p>${verifyUrl}</p>
    `,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log("Email preview URL:", preview);
  }
};

module.exports = {
  sendVerificationEmail,
};
