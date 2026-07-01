// Copyright (c) 2026 Veer Varma. All rights reserved.

import { SettlementSDK } from '@klendoo/payment-core';
import { calendar_v3, google } from 'googleapis';
import nodemailer from 'nodemailer';

export interface ReminderRequest {
  bookingId: string;
  calendarEventId: string;
  visitorEmail: string;
  visitorName: string;
  hostEmail: string;
  hostAddress: string;
  sessionStartTime: string;
  sessionType: string;
}

export interface ReminderResponse {
  success: boolean;
  emailSent: boolean;
  reminderSet: boolean;
  settlementHash?: string;
  error?: string;
}

export class ReminderAgent {
  private settlement: SettlementSDK;
  private calendar: calendar_v3.Calendar;
  private mailer: nodemailer.Transporter;

  constructor(
    googleAuth: any,
    settlementSDK: SettlementSDK,
    emailConfig?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    }
  ) {
    this.settlement = settlementSDK;
    this.calendar = google.calendar({ version: 'v3', auth: googleAuth });
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

  async handle(request: ReminderRequest): Promise<ReminderResponse> {
    try {
      const emailSent = await this.sendReminderEmail(
        request.visitorEmail,
        request.visitorName,
        request.sessionStartTime
      );

      const reminderSet = await this.updateCalendarReminder(request.calendarEventId);

      const settlementResult = await this.settlement.settle(
        request.hostAddress,
        'reminder',
        0.03,
        `Reminder email for booking ${request.bookingId}`
      );

      return {
        success: settlementResult.success,
        emailSent,
        reminderSet,
        settlementHash: settlementResult.transactionHash,
        error: settlementResult.error
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        emailSent: false,
        reminderSet: false,
        error: errorMessage
      };
    }
  }

  private async sendReminderEmail(
    visitorEmail: string,
    visitorName: string,
    sessionStartTime: string
  ): Promise<boolean> {
    try {
      const sessionTime = new Date(sessionStartTime);
      const formattedTime = sessionTime.toLocaleString();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@klendoo.app',
        to: visitorEmail,
        subject: `Reminder: Your session is coming up - Klendoo`,
        html: `
          <h2>Session Reminder</h2>
          <p>Hi ${visitorName},</p>
          <p>This is a reminder that your session is scheduled for:</p>
          <p><strong>${formattedTime}</strong></p>
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br>Klendoo Team</p>
        `
      };

      await this.mailer.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return false;
    }
  }

  private async updateCalendarReminder(calendarEventId: string): Promise<boolean> {
    try {
      const event = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: calendarEventId
      });

      if (!event.data) return false;

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId: calendarEventId,
        requestBody: {
          ...event.data,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 },
              { method: 'email', minutes: 5 }
            ]
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar reminder:', error);
      return false;
    }
  }
}

export async function handler(event: ReminderRequest): Promise<ReminderResponse> {
  const settlement = new SettlementSDK(process.env.GOPLAUSIBLE_API_KEY);
  const googleAuth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.send']
  });

  const agent = new ReminderAgent(googleAuth, settlement);
  return agent.handle(event);
}
