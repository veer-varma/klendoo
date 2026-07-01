// Copyright (c) 2026 Veer Varma. All rights reserved.

import { X402Middleware } from '@klendoo/payment-core';
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
  transactionHash?: string;
  error?: string;
  paymentRequired?: boolean;
  x402?: {
    statusCode: 402;
    headers: Record<string, string>;
  };
}

const BOOKING_AGENT_COST = 0.05;

export class BookingAgent {
  private calendar: calendar_v3.Calendar;
  private gmail: gmail_v1.Gmail;
  private mailer: nodemailer.Transporter;

  constructor(
    googleAuth: any,
    emailConfig?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    }
  ) {
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

  /**
   * Check if payment requirement is met
   */
  async checkPaymentRequirement(
    headers: Record<string, string>,
    hostAddress: string
  ): Promise<{ authorized: boolean; response?: BookingResponse }> {
    const hasPayment = await X402Middleware.hasValidPayment(
      headers,
      BOOKING_AGENT_COST,
      hostAddress
    );

    if (!hasPayment) {
      const x402Header = X402Middleware.generateX402Header({
        amount: BOOKING_AGENT_COST,
        recipient: hostAddress,
        action: 'booking',
        note: 'Booking agent invocation via x402'
      });

      return {
        authorized: false,
        response: {
          success: false,
          paymentRequired: true,
          error: 'x402 Payment Required',
          x402: {
            statusCode: x402Header.statusCode,
            headers: x402Header.headers
          }
        }
      };
    }

    return { authorized: true };
  }

  async handle(request: BookingRequest, headers: Record<string, string>): Promise<BookingResponse> {
    const paymentCheck = await this.checkPaymentRequirement(headers, request.hostAddress);
    if (!paymentCheck.authorized) {
      return paymentCheck.response!;
    }

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

      await this.sendConfirmationEmail(request.visitorEmail, request.visitorName, availableSlot);

      return {
        success: true,
        bookingId: `booking-${Date.now()}`,
        calendarEventId
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
      description: `Booked via Klendoo (x402 Payment Confirmed)\nSession Type: ${sessionType}`,
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
        <p>Powered by Klendoo (x402 Payments)</p>
        <p>Best regards,<br>Klendoo</p>
      `
    };

    await this.mailer.sendMail(mailOptions);
  }
}

export async function handler(
  event: BookingRequest,
  context?: { headers: Record<string, string> }
): Promise<BookingResponse> {
  const googleAuth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.send']
  });

  const agent = new BookingAgent(googleAuth);
  const headers = context?.headers || {};

  return agent.handle(event, headers);
}
