import { Intent } from './types';

export class IntentDetector {
  private keywords: Record<string, string[]> = {
    schedule_meeting: [
      'schedule',
      'meeting',
      'with',
      'book',
      'setup',
      'arrange',
      'set up',
      'organize',
    ],
    check_availability: ['available', 'when', 'free', 'busy', 'calendar', 'slots', 'time slots'],
    modify_meeting: ['modify', 'change', 'reschedule', 'move', 'update', 'reschedule'],
    cancel_meeting: ['cancel', 'delete', 'remove', 'decline', 'decline meeting'],
    get_status: ['status', 'confirm', 'what time', 'when is', 'details'],
  };

  detect(message: string): Intent {
    const lowerMessage = message.toLowerCase();

    for (const [intentType, keywords] of Object.entries(this.keywords)) {
      const matchCount = keywords.filter((k) => lowerMessage.includes(k)).length;
      const confidence = Math.min(matchCount / keywords.length, 1.0);

      if (confidence > 0.3) {
        return {
          type: intentType as Intent['type'],
          confidence,
          explanation: `Detected intent based on keywords: ${keywords.filter((k) => lowerMessage.includes(k)).join(', ')}`,
        };
      }
    }

    return {
      type: 'unknown',
      confidence: 0.2,
      explanation: 'Could not determine intent from message',
    };
  }

  detectMultiple(message: string, threshold: number = 0.4): Intent[] {
    const intents: Intent[] = [];
    const lowerMessage = message.toLowerCase();

    for (const [intentType, keywords] of Object.entries(this.keywords)) {
      const matchCount = keywords.filter((k) => lowerMessage.includes(k)).length;
      const confidence = Math.min(matchCount / keywords.length, 1.0);

      if (confidence > threshold) {
        intents.push({
          type: intentType as Intent['type'],
          confidence,
          explanation: `Detected with confidence ${(confidence * 100).toFixed(0)}%`,
        });
      }
    }

    return intents.sort((a, b) => b.confidence - a.confidence);
  }
}
