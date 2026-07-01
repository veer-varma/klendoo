import axios from 'axios';
import { NLUResponse, Intent, Entity } from './types';

export class DeepseekNLU {
  private apiKey: string;
  private apiUrl: string;
  private model: string = 'deepseek-chat';

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.apiUrl = apiUrl || process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY not set - NLU features will be limited');
    }
  }

  async processMessage(userMessage: string, context: any = {}): Promise<NLUResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseDeepseekResponse(userMessage, aiResponse, context);
    } catch (error) {
      console.error('Deepseek API error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private getSystemPrompt(): string {
    return `You are Klendoo, an intelligent scheduling assistant. Your job is to help users schedule meetings intelligently.

When a user provides a scheduling request, extract and identify:
1. Intent: What do they want? (schedule_meeting, check_availability, modify_meeting, cancel_meeting, get_status)
2. Participants: Who should be in the meeting? (list names)
3. Time: When do they want to meet? (date + time, or relative like "this week")
4. Duration: How long? (in minutes)
5. Purpose: What's the meeting about?
6. Location: Where? (optional - in-person, Zoom, etc.)

Always respond in JSON format:
{
  "intent": "schedule_meeting|check_availability|modify_meeting|cancel_meeting|get_status|unknown",
  "confidence": 0.0-1.0,
  "participants": ["name1", "name2"],
  "proposedDate": "YYYY-MM-DD or relative",
  "proposedTime": "HH:MM",
  "duration": 30,
  "purpose": "meeting purpose",
  "location": "location or null",
  "urgency": "immediate|flexible",
  "explanation": "Brief explanation of the request",
  "response": "Natural language response to the user",
  "nextStep": "What should happen next?",
  "requiresConfirmation": true|false
}

Be helpful, ask clarifying questions if needed, and confirm details before scheduling.`;
  }

  private parseDeepseekResponse(userMessage: string, aiResponse: string, context: any): NLUResponse {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getFallbackResponse(userMessage);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        message: userMessage,
        intent: {
          type: parsed.intent || 'unknown',
          confidence: parsed.confidence || 0.5,
          explanation: parsed.explanation || '',
        },
        entities: this.extractEntities(parsed),
        response: parsed.response || "I'll help you schedule that meeting.",
        nextStep: parsed.nextStep || 'Waiting for your confirmation',
        requiresConfirmation: parsed.requiresConfirmation !== false,
      };
    } catch (error) {
      console.error('Failed to parse Deepseek response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private extractEntities(parsed: any): Entity[] {
    const entities: Entity[] = [];

    if (parsed.participants && Array.isArray(parsed.participants)) {
      parsed.participants.forEach((p: string) => {
        entities.push({
          type: 'participant',
          value: p,
          confidence: 0.9,
        });
      });
    }

    if (parsed.proposedDate) {
      entities.push({
        type: 'date',
        value: parsed.proposedDate,
        confidence: 0.85,
      });
    }

    if (parsed.proposedTime) {
      entities.push({
        type: 'time',
        value: parsed.proposedTime,
        confidence: 0.85,
      });
    }

    if (parsed.duration) {
      entities.push({
        type: 'duration',
        value: `${parsed.duration} minutes`,
        confidence: 0.9,
      });
    }

    if (parsed.purpose) {
      entities.push({
        type: 'purpose',
        value: parsed.purpose,
        confidence: 0.85,
      });
    }

    if (parsed.location) {
      entities.push({
        type: 'location',
        value: parsed.location,
        confidence: 0.8,
      });
    }

    return entities;
  }

  private getFallbackResponse(userMessage: string): NLUResponse {
    const lowerMessage = userMessage.toLowerCase();

    let intent: Intent['type'] = 'unknown';
    if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('with')) {
      intent = 'schedule_meeting';
    } else if (lowerMessage.includes('available') || lowerMessage.includes('when')) {
      intent = 'check_availability';
    } else if (lowerMessage.includes('modify') || lowerMessage.includes('change') || lowerMessage.includes('reschedule')) {
      intent = 'modify_meeting';
    } else if (lowerMessage.includes('cancel') || lowerMessage.includes('delete')) {
      intent = 'cancel_meeting';
    }

    return {
      message: userMessage,
      intent: {
        type: intent,
        confidence: intent === 'unknown' ? 0.3 : 0.6,
        explanation: 'Fallback NLU (API key not configured)',
      },
      entities: [],
      response: `I understand you want to "${userMessage}". Could you provide more details about who should be in the meeting and when you'd like to meet?`,
      nextStep: 'Awaiting clarification from user',
      requiresConfirmation: true,
    };
  }
}
