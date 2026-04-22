import { Resend } from 'resend';
import { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, react }: SendEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'HabitFlow <hello@habitflow.app>',
      to,
      subject,
      react,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
