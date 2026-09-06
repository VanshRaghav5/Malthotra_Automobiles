import { Resend } from 'resend';
import { config } from '../config';
import type { Request } from '../types';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendRequestConfirmation(
  toEmail: string,
  request: Request,
  customerInfo: { customerName: string; vehicleMake: string; vehicleModel: string }
): Promise<void> {
  const html = `
    <h1>Request Received - Malhotra Automobiles</h1>
    <p>Dear ${customerInfo.customerName},</p>
    <p>Thank you for your request! Here are the details:</p>
    <ul>
      <li><strong>Request ID:</strong> ${request.request_number}</li>
      <li><strong>Vehicle:</strong> ${customerInfo.vehicleMake} ${customerInfo.vehicleModel}</li>
      <li><strong>Status:</strong> ${request.status}</li>
      <li><strong>Estimated Total:</strong> $${request.estimated_total?.toFixed(2) || '0.00'}</li>
    </ul>
    <p>We will review your request and get back to you shortly.</p>
    <p>Best regards,<br>Malhotra Automobiles</p>
  `;

  await resend.emails.send({
    from: config.FROM_EMAIL,
    to: toEmail,
    subject: `Request ${request.request_number} - Malhotra Automobiles`,
    html,
  });
}

export async function sendStatusUpdate(
  toEmail: string,
  request: Request,
  newStatus: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    accepted: 'Your request has been accepted!',
    rejected: 'We regret to inform you that your request could not be fulfilled.',
    ready_for_visit: 'Your request is ready! Please visit us to complete your order.',
    completed: 'Your request has been completed. Thank you!',
    cancelled: 'Your request has been cancelled.',
  };

  const html = `
    <h1>Status Update - Malhotra Automobiles</h1>
    <p>Dear Customer,</p>
    <p>${statusMessages[newStatus] || `Your request status has been updated to: ${newStatus}`}</p>
    <p><strong>Request ID:</strong> ${request.request_number}</p>
    <p>Best regards,<br>Malhotra Automobiles</p>
  `;

  await resend.emails.send({
    from: config.FROM_EMAIL,
    to: toEmail,
    subject: `Request ${request.request_number} - Status Update`,
    html,
  });
}
