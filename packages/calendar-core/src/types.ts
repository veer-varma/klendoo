export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  status: 'tentative' | 'confirmed' | 'cancelled';
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface ParticipantResponse {
  email: string;
  name: string;
  status: 'accepted' | 'declined' | 'pending';
  responseTime?: string;
}

export interface SchedulingRequest {
  participants: string[];
  proposedDate?: string;
  proposedTime?: string;
  duration: number;
  purpose: string;
  timezone?: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken: string;
  refreshToken: string;
}
