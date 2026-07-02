// Copyright (c) 2026 Veer Varma. All rights reserved.

export type Intent = 'book' | 'check_availability' | 'follow_up' | 'reschedule' | 'cancel' | 'unknown';

export interface Message {
  userId: string;
  text: string;
  userRole: 'visitor' | 'host';
  sessionId: string;
}

export interface OrchestrationResponse {
  intent: Intent;
  action: string;
  payload: Record<string, unknown>;
  response: string;
}

export class OrchestrationAgent {
  private intentKeywords = {
    book: ['book', 'schedule', 'reserve', 'appointment', 'meeting', 'session', 'when can i'],
    check_availability: ['available', 'free', 'open slots', 'times', 'when is'],
    follow_up: ['follow up', 'followup', 'send message', 'email'],
    reschedule: ['reschedule', 'change time', 'move', 'different time', 'another time'],
    cancel: ['cancel', 'delete', 'remove', 'nevermind']
  };

  detectIntent(text: string): Intent {
    const lowerText = text.toLowerCase();

    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return intent as Intent;
        }
      }
    }

    return 'unknown';
  }

  async route(message: Message): Promise<OrchestrationResponse> {
    const intent = this.detectIntent(message.text);

    switch (intent) {
      case 'book':
        return this.routeToBooking(message);
      case 'check_availability':
        return this.routeToAvailability(message);
      case 'follow_up':
        return this.routeToFollowUp(message);
      case 'reschedule':
        return this.routeToReschedule(message);
      case 'cancel':
        return this.routeToCancel(message);
      default:
        return this.routeToFallback(message);
    }
  }

  private routeToBooking(message: Message): OrchestrationResponse {
    return {
      intent: 'book',
      action: 'invoke_booking_agent',
      payload: {
        visitorEmail: message.userId,
        sessionId: message.sessionId
      },
      response: 'I can help you book a session! What time works best for you?'
    };
  }

  private routeToAvailability(message: Message): OrchestrationResponse {
    return {
      intent: 'check_availability',
      action: 'fetch_calendar_slots',
      payload: {
        sessionId: message.sessionId
      },
      response: 'Let me check available times for you...'
    };
  }

  private routeToFollowUp(message: Message): OrchestrationResponse {
    return {
      intent: 'follow_up',
      action: 'invoke_follow_up_agent',
      payload: {
        sessionId: message.sessionId
      },
      response: 'I can send a follow-up message for you.'
    };
  }

  private routeToReschedule(message: Message): OrchestrationResponse {
    return {
      intent: 'reschedule',
      action: 'reschedule_booking',
      payload: {
        sessionId: message.sessionId
      },
      response: 'What time would work better for you?'
    };
  }

  private routeToCancel(message: Message): OrchestrationResponse {
    return {
      intent: 'cancel',
      action: 'cancel_booking',
      payload: {
        sessionId: message.sessionId
      },
      response: 'I can cancel your session. Are you sure?'
    };
  }

  private routeToFallback(message: Message): OrchestrationResponse {
    return {
      intent: 'unknown',
      action: 'human_escalation',
      payload: {
        message: message.text,
        sessionId: message.sessionId
      },
      response: 'I didn\'t quite understand that. Could you rephrase or select an option?'
    };
  }
}

export async function handler(event: Message): Promise<OrchestrationResponse> {
  const agent = new OrchestrationAgent();
  return agent.route(event);
}
