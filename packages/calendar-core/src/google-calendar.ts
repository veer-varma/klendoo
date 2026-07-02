import { google } from 'googleapis';
import { CalendarEvent, GoogleCalendarConfig } from './types';

export class GoogleCalendarClient {
  private calendar: any;
  private config: GoogleCalendarConfig;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });
    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async createEvent(event: Partial<CalendarEvent>, calendarId: string = 'primary') {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          attendees: event.attendees?.map((email) => ({ email })),
          location: event.location,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary') {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          attendees: event.attendees?.map((email) => ({ email })),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary') {
    try {
      await this.calendar.events.delete({ calendarId, eventId });
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }

  async getFreeBusyTimes(emails: string[], timeMin: string, timeMax: string) {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: emails.map((email) => ({ id: email })),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get free/busy times:', error);
      return null;
    }
  }
}
