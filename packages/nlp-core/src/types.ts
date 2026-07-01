export interface Intent {
  type: 'schedule_meeting' | 'check_availability' | 'modify_meeting' | 'cancel_meeting' | 'get_status' | 'unknown';
  confidence: number;
  explanation: string;
}

export interface Entity {
  type: 'participant' | 'date' | 'time' | 'duration' | 'purpose' | 'location';
  value: string;
  confidence: number;
}

export interface NLUResponse {
  message: string;
  intent: Intent;
  entities: Entity[];
  response: string;
  nextStep: string;
  requiresConfirmation: boolean;
}

export interface SchedulingRequest {
  participants: string[];
  proposedDate?: string;
  proposedTime?: string;
  duration?: number;
  purpose?: string;
  location?: string;
  urgency: 'immediate' | 'flexible';
}
