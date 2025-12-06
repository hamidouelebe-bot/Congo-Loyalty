import nodemailer from 'nodemailer';

// Configure Transporter
// If variables are missing, it will default to Ethereal (Test Account) or just log
const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Create Ethereal Test Account
    console.log('SMTP Credentials missing. Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

let transporter: nodemailer.Transporter | null = null;

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!transporter) {
    transporter = await createTransporter();
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"DRC Loyalty" <no-reply@drcloyalty.com>',
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    // If using Ethereal, log the URL
    if (info.messageId && !process.env.SMTP_HOST) {
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendOtpEmail = async (to: string, otp: string) => {
  const subject = 'Your Verification Code - DRC Loyalty';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to DRC Loyalty</h2>
      <p>Use the verification code below to complete your signup:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px;">
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #1f2937; margin: 0;">${otp}</h1>
      </div>
      <p>This code expires in 10 minutes.</p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = 'Welcome to DRC Loyalty!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
      <p>We are thrilled to have you join the DRC Loyalty program.</p>
      <p>You can now:</p>
      <ul>
        <li>Scan receipts from partner supermarkets</li>
        <li>Earn points for every purchase</li>
        <li>Redeem points for airtime, vouchers, and products</li>
      </ul>
      <p>Start scanning today!</p>
      <div style="margin-top: 30px; text-align: center;">
        <a href="#" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Open App</a>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};
