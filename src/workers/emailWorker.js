const { Worker } = require('../services/Queue');
const { connection } = require('../services/Queue');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Email worker
new Worker('email', async (job) => {
  const { to, subject, html, text } = job.data;
  
  logger.info('Processing email job', { jobId: job.id, to, subject });
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html
    });
    
    logger.info('Email sent successfully', {
      jobId: job.id,
      messageId: info.messageId,
      to
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send failed', {
      jobId: job.id,
      to,
      error: error.message
    });
    throw error;
  }
}, {
  connection,
  concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY) || 5
});

logger.info('✅ Email worker registered');

