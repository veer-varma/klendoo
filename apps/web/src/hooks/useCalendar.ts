import { useState, useCallback } from 'react';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
}

interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  syncCalendar: () => Promise<void>;
  getAvailability: (date: string) => Promise<string[]>;
  createEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  connected: boolean;
}

export function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const syncCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/calendar/sync');
      setEvents(response.data.events || []);
      setConnected(true);
    } catch (err) {
      setError('Failed to sync calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailability = useCallback(async (date: string) => {
    try {
      const response = await axios.get(`/api/calendar/availability`, {
        params: { date },
      });
      return response.data.availableSlots || [];
    } catch (err) {
      console.error('Failed to get availability:', err);
      return [];
    }
  }, []);

  const createEvent = useCallback(async (event: Partial<CalendarEvent>) => {
    try {
      const response = await axios.post('/api/calendar/events', event);
      setEvents((prev) => [...prev, response.data.event]);
      return response.data.event;
    } catch (err) {
      throw new Error('Failed to create event');
    }
  }, []);

  return {
    events,
    loading,
    error,
    syncCalendar,
    getAvailability,
    createEvent,
    connected,
  };
}
