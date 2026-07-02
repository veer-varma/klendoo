import { Entity } from './types';

export class EntityExtractor {
  extractParticipants(message: string): string[] {
    const participants: string[] = [];

    const withPattern = /with\s+([A-Za-z\s,and]+?)(?:\s+(?:this|next|on|at|for|to|and|$))/i;
    const withMatch = message.match(withPattern);
    if (withMatch) {
      const names = withMatch[1]
        .split(/\s+(?:and|,)\s+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 2);
      participants.push(...names);
    }

    const andPattern = /([A-Z][a-z]+)\s+and\s+([A-Z][a-z]+)/g;
    let match;
    while ((match = andPattern.exec(message)) !== null) {
      participants.push(match[1], match[2]);
    }

    return [...new Set(participants)];
  }

  extractDate(message: string): string | null {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const relativePatterns: Record<string, number> = {
      today: 0,
      tomorrow: 1,
      'this week': 0,
      'next week': 7,
      'next monday': 0,
      'next tuesday': 1,
      'next wednesday': 2,
      'next thursday': 3,
      'next friday': 4,
      'next saturday': 5,
      'next sunday': 6,
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
    };

    const lowerMessage = message.toLowerCase();
    for (const [pattern, days] of Object.entries(relativePatterns)) {
      if (lowerMessage.includes(pattern)) {
        const date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      }
    }

    const isoPattern = /(\d{4}-\d{2}-\d{2})/;
    const isoMatch = message.match(isoPattern);
    if (isoMatch) {
      return isoMatch[1];
    }

    return null;
  }

  extractTime(message: string): string | null {
    const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/;
    const match = message.match(timePattern);

    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2];
      const meridiem = match[3];

      if (meridiem) {
        if (meridiem.toLowerCase() === 'pm' && hour !== 12) {
          hour += 12;
        } else if (meridiem.toLowerCase() === 'am' && hour === 12) {
          hour = 0;
        }
      }

      return `${String(hour).padStart(2, '0')}:${minute}`;
    }

    const naturalPattern = /\b(morning|afternoon|evening|noon|midnight)\b/i;
    const naturalMatch = message.match(naturalPattern);
    if (naturalMatch) {
      const time = naturalMatch[1].toLowerCase();
      switch (time) {
        case 'morning':
          return '09:00';
        case 'afternoon':
          return '14:00';
        case 'evening':
          return '18:00';
        case 'noon':
          return '12:00';
        case 'midnight':
          return '00:00';
      }
    }

    return null;
  }

  extractDuration(message: string): number | null {
    const durationPattern = /(\d+)\s*(hours?|hrs?|minutes?|mins?)/i;
    const match = message.match(durationPattern);

    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      if (unit.startsWith('h')) {
        return value * 60;
      }
      return value;
    }

    return null;
  }

  extractPurpose(message: string): string | null {
    const purposePattern = /(?:about|discuss|regarding|for|to|meeting on|meeting about)\s+([^,.!?]+)/i;
    const match = message.match(purposePattern);
    return match ? match[1].trim() : null;
  }

  extractLocation(message: string): string | null {
    const locations = ['zoom', 'google meet', 'in-person', 'office', 'virtual', 'call', 'phone'];
    const lowerMessage = message.toLowerCase();

    for (const location of locations) {
      if (lowerMessage.includes(location)) {
        return location;
      }
    }

    return null;
  }

  extractAll(message: string): Entity[] {
    const entities: Entity[] = [];

    const participants = this.extractParticipants(message);
    participants.forEach((p) => {
      entities.push({
        type: 'participant',
        value: p,
        confidence: 0.85,
      });
    });

    const date = this.extractDate(message);
    if (date) {
      entities.push({
        type: 'date',
        value: date,
        confidence: 0.9,
      });
    }

    const time = this.extractTime(message);
    if (time) {
      entities.push({
        type: 'time',
        value: time,
        confidence: 0.9,
      });
    }

    const duration = this.extractDuration(message);
    if (duration) {
      entities.push({
        type: 'duration',
        value: `${duration} minutes`,
        confidence: 0.85,
      });
    }

    const purpose = this.extractPurpose(message);
    if (purpose) {
      entities.push({
        type: 'purpose',
        value: purpose,
        confidence: 0.75,
      });
    }

    const location = this.extractLocation(message);
    if (location) {
      entities.push({
        type: 'location',
        value: location,
        confidence: 0.8,
      });
    }

    return entities;
  }
}
