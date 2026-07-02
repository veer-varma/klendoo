import { useState, useCallback } from 'axios';
import axios from 'axios';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  entities?: any[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  loading: boolean;
  sessionState: any;
}

export function useChat(mode: 'host' | 'visitor' = 'host'): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionState, setSessionState] = useState<any>({});

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        context: sessionState,
        mode,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        intent: response.data.intent,
        entities: response.data.entities,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data.entities && response.data.entities.length > 0) {
        const newState = { ...sessionState };
        response.data.entities.forEach((entity: any) => {
          switch (entity.type) {
            case 'participant':
              newState.participants = [...(newState.participants || []), entity.value];
              break;
            case 'date':
              newState.proposedDate = entity.value;
              break;
            case 'time':
              newState.proposedTime = entity.value;
              break;
            case 'duration':
              newState.duration = entity.value;
              break;
            case 'purpose':
              newState.purpose = entity.value;
              break;
          }
        });
        setSessionState(newState);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Could you try again?',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, sessionState, mode]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    loading,
    sessionState,
  };
}
