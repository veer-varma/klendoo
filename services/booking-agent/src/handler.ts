// Copyright (c) 2026 Veer Varma. All rights reserved.

import { SettlementSDK, ActionType } from '@klendoo/payment-core';
import { calendar_v3, gmail_v1, google } from 'googleapis';
import nodemailer from 'nodemailer';

export interface BookingRequest {
  visitorName: string;
  visitorEmail: string;
  hostId: string;
  hostAddress: string;
  preferredTimes: string[];
  sessionType: string;
  duration: number;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  calendarEventId?: string;
  settlementHash?: string;
  error?: string;
}

export class BookingAgent {
  private settlement: SettlementSDK;
  private calendar: calendar_v3.Calendar;
  private gmail: gmail_v1.Gmail;
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
    this.gmail = google.gmail({ version: 'v1', auth: googleAuth });

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

  async handle(request: BookingRequest): Promise<BookingResponse> {
    try {
      const availableSlot = await this.findAvailableSlot(request.hostId, request.preferredTimes);
      if (!availableSlot) {
        return {
          success: false,
          error: 'No available time slots found'
        };
      }

      const calendarEventId = await this.createCalendarEvent(
        request.hostId,
        request.visitorEmail,
        availableSlot,
        request.sessionType,
        request.duration
      );

      const settlementResult = await this.settlement.settle(
        request.hostAddress,
        'booking',
        0.05,
        `Booking confirmation for ${request.visitorName}`
      );

      if (!settlementResult.success) {
        return {
          success: false,
          error: `Settlement failed: ${settlementResult.error}`,
          calendarEventId
        };
      }

      await this.sendConfirmationEmail(request.visitorEmail, request.visitorName, availableSlot);

      return {
        success: true,
        bookingId: `booking-${Date.now()}`,
        calendarEventId,
        settlementHash: settlementResult.transactionHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private async findAvailableSlot(
    hostId: string,
    preferredTimes: string[]
  ): Promise<string | null> {
    try {
      const now = new Date();
      const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const events = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: maxDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const busyTimes = events.data.items?.map(e => e.start?.dateTime) || [];

      for (const preferred of preferredTimes) {
        if (!busyTimes.includes(preferred)) {
          return preferred;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding available slot:', error);
      return null;
    }
  }

  private async createCalendarEvent(
    hostId: string,
    visitorEmail: string,
    startTime: string,
    sessionType: string,
    duration: number
  ): Promise<string> {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const event = {
      summary: `Session with ${visitorEmail} (${sessionType})`,
      description: `Booked via Klendoo\nSession Type: ${sessionType}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: visitorEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      }
    };

    const result = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    return result.data.id || '';
  }

  private async sendConfirmationEmail(
    visitorEmail: string,
    visitorName: string,
    bookingTime: string
  ): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@klendoo.app',
      to: visitorEmail,
      subject: 'Booking Confirmed - Klendoo',
      html: `
        <h2>Your booking is confirmed!</h2>
        <p>Hi ${visitorName},</p>
        <p>Your session has been scheduled for <strong>${bookingTime}</strong></p>
        <p>You'll receive a calendar invite shortly.</p>
        <p>Best regards,<br>Klendoo</p>
      `
    };

    await this.mailer.sendMail(mailOptions);
  }
}

export async function handler(event: BookingRequest): Promise<BookingResponse> {
  const settlement = new SettlementSDK(process.env.GOPLAUSIBLE_API_KEY);
  const googleAuth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.send']
  });

  const agent = new BookingAgent(googleAuth, settlement);
  return agent.handle(event);
}
