import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  intent: string;
  entities: any[];
  nextStep: string;
  requiresConfirmation: boolean;
}

const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekApiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Call Deepseek API for NLU
    const nluResponse = await callDeepseekNLU(message);

    return res.status(200).json({
      success: true,
      response: nluResponse.response,
      intent: nluResponse.intent,
      entities: nluResponse.entities || [],
      nextStep: nluResponse.nextStep,
      requiresConfirmation: nluResponse.requiresConfirmation,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Fallback response when API fails
    return res.status(200).json({
      success: true,
      response: `I understand you want to "${message}". Could you provide more details about who should be in the meeting and when?`,
      intent: 'unknown',
      entities: [],
      nextStep: 'Awaiting user clarification',
      requiresConfirmation: true,
    });
  }
}

async function callDeepseekNLU(userMessage: string): Promise<any> {
  if (!deepseekApiKey) {
    return getFallbackResponse(userMessage);
  }

  try {
    const response = await axios.post(
      `${deepseekApiUrl}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(),
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    return parseDeepseekResponse(aiResponse);
  } catch (error) {
    console.error('Deepseek API call failed:', error);
    return getFallbackResponse(userMessage);
  }
}

function getSystemPrompt(): string {
  return `You are Klendoo, an intelligent scheduling assistant. Help users schedule meetings.

Extract and respond with JSON:
{
  "intent": "schedule_meeting|check_availability|modify_meeting|cancel_meeting|get_status|unknown",
  "participants": ["name1", "name2"],
  "proposedDate": "date or null",
  "proposedTime": "HH:MM or null",
  "duration": 30,
  "purpose": "meeting purpose or null",
  "response": "Natural language response to user",
  "nextStep": "What happens next?",
  "requiresConfirmation": true|false
}

Always be helpful and ask clarifying questions.`;
}

function parseDeepseekResponse(aiResponse: string): any {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        response: aiResponse,
        intent: 'unknown',
        entities: [],
        nextStep: 'Processing message',
        requiresConfirmation: true,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const entities = [];
    if (parsed.participants) {
      parsed.participants.forEach((p: string) => {
        entities.push({ type: 'participant', value: p });
      });
    }
    if (parsed.proposedDate) {
      entities.push({ type: 'date', value: parsed.proposedDate });
    }
    if (parsed.proposedTime) {
      entities.push({ type: 'time', value: parsed.proposedTime });
    }
    if (parsed.duration) {
      entities.push({ type: 'duration', value: `${parsed.duration} minutes` });
    }
    if (parsed.purpose) {
      entities.push({ type: 'purpose', value: parsed.purpose });
    }

    return {
      response: parsed.response || 'I understood your request.',
      intent: parsed.intent || 'unknown',
      entities,
      nextStep: parsed.nextStep || 'Awaiting confirmation',
      requiresConfirmation: parsed.requiresConfirmation !== false,
    };
  } catch (error) {
    console.error('Failed to parse response:', error);
    return {
      response: aiResponse,
      intent: 'unknown',
      entities: [],
      nextStep: 'Processing message',
      requiresConfirmation: true,
    };
  }
}

function getFallbackResponse(message: string): any {
  const lowerMessage = message.toLowerCase();

  let intent = 'unknown';
  if (
    lowerMessage.includes('schedule') ||
    lowerMessage.includes('meeting') ||
    lowerMessage.includes('with')
  ) {
    intent = 'schedule_meeting';
  } else if (lowerMessage.includes('available') || lowerMessage.includes('when')) {
    intent = 'check_availability';
  }

  return {
    response: `I understand you want to "${message}". Could you tell me who should attend and when you'd like to meet?`,
    intent,
    entities: [],
    nextStep: 'Awaiting more details',
    requiresConfirmation: true,
  };
}
