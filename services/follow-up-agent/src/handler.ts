// Copyright (c) 2026 Veer Varma. All rights reserved.

import { SettlementSDK } from '@klendoo/payment-core';
import nodemailer from 'nodemailer';

export interface FollowUpRequest {
  bookingId: string;
  visitorEmail: string;
  visitorName: string;
  hostAddress: string;
  sessionType: string;
}

export interface FollowUpResponse {
  success: boolean;
  emailSent: boolean;
  settlementHash?: string;
  error?: string;
}

export class FollowUpAgent {
  private settlement: SettlementSDK;
  private mailer: nodemailer.Transporter;

  constructor(
    settlementSDK: SettlementSDK,
    emailConfig?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    }
  ) {
    this.settlement = settlementSDK;
    this.mailer = nodemailer.createTransport({
      host: emailConfig?.host || 'smtp.gmail.com',
      port: emailConfig?.port || 587,
      secure: false,
      auth: {
        user: emailConfig?.user,
        pass: emailConfig?.pass
      }
    });
  }

  async handle(request: FollowUpRequest): Promise<FollowUpResponse> {
    try {
      const emailSent = await this.sendFollowUpEmail(
        request.visitorEmail,
        request.visitorName,
        request.sessionType
      );

      if (!emailSent) {
        return {
          success: false,
          emailSent: false,
          error: 'Failed to send follow-up email'
        };
      }

      const settlementResult = await this.settlement.settle(
        request.hostAddress,
        'follow-up',
        0.02,
        `Follow-up email for booking ${request.bookingId}`
      );

      return {
        success: settlementResult.success,
        emailSent: true,
        settlementHash: settlementResult.transactionHash,
        error: settlementResult.error
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        emailSent: false,
        error: errorMessage
      };
    }
  }

  private async sendFollowUpEmail(
    visitorEmail: string,
    visitorName: string,
    sessionType: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@klendoo.app',
        to: visitorEmail,
        subject: 'How was your session? - Klendoo',
        html: `
          <h2>We'd love to hear from you!</h2>
          <p>Hi ${visitorName},</p>
          <p>Thank you for attending your ${sessionType} session with us!</p>
          <p>We'd appreciate any feedback you have about your experience. Your insights help us improve.</p>
          <p>Best regards,<br>Klendoo Team</p>
        `
      };

      await this.mailer.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending follow-up email:', error);
      return false;
    }
  }
}

export async function handler(event: FollowUpRequest): Promise<FollowUpResponse> {
  const settlement = new SettlementSDK(process.env.GOPLAUSIBLE_API_KEY);
  const agent = new FollowUpAgent(settlement);
  return agent.handle(event);
}
