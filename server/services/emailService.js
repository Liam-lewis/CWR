const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // false for 587, true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendReportEmail = async (report, files, baseUrl) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured. Skipping notification.');
    return;
  }

  const recipients = process.env.EMAIL_RECIPIENTS ? process.env.EMAIL_RECIPIENTS.split(',') : [process.env.EMAIL_USER];
  
  // Calculate total size
  let totalSize = 0;
  files.forEach(f => totalSize += f.size);
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const attachments = [];
  let evidenceText = 'See attached files.';

  if (totalSize > MAX_SIZE) {
    evidenceText = `Evidence files are too large to attach. Download them here:\n`;
    files.forEach(f => {
       evidenceText += `- ${baseUrl}/uploads/${f.filename}\n`;
    });
  } else {
    files.forEach(f => {
      attachments.push({
        filename: f.originalname,
        path: f.path
      });
    });
  }

  const mailOptions = {
    from: `"Community Watch" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: recipients,
    subject: `New Report: ${report.referenceNumber} - ${report.type}`,
    text: `
      New Community Watch Report Received.
      
      Reference: ${report.referenceNumber}
      Type: ${report.type}
      Location: ${report.location}
      Date/Time: ${report.date} at ${report.time}
      
      Description:
      ${report.description}
      
      Evidence:
      ${evidenceText}
      
      View full report on Dashboard: ${baseUrl.replace(':3001', ':8081')}/admin
    `,
    attachments: attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email notification sent:', info.messageId);
    // If using Ethereal, log the preview URL
    if (info.messageId && process.env.EMAIL_HOST.includes('ethereal')) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

module.exports = { sendReportEmail };