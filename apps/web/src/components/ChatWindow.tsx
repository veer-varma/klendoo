import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  entities?: any[];
}

export interface ChatWindowProps {
  hostName?: string;
  onScheduleConfirmed?: (details: any) => void;
  mode?: 'host' | 'visitor';
}

export default function ChatWindow({ hostName, onScheduleConfirmed, mode = 'host' }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionState, setSessionState] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const greeting =
      mode === 'host'
        ? `Hi ${hostName || 'there'}! 👋 I'm your scheduling assistant. You can say things like "Schedule a meeting with Amanda and Jay this week" or "Check my availability for tomorrow".`
        : 'Hi! 👋 I can help you find a meeting time. Tell me what you need - for example, "I need 30 minutes next week for a project discussion".';

    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [mode, hostName]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
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

      const assistantMessage: Message = {
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
          if (entity.type === 'participant') {
            newState.participants = [...(newState.participants || []), entity.value];
          } else if (entity.type === 'date') {
            newState.proposedDate = entity.value;
          } else if (entity.type === 'time') {
            newState.proposedTime = entity.value;
          } else if (entity.type === 'duration') {
            newState.duration = entity.value;
          } else if (entity.type === 'purpose') {
            newState.purpose = entity.value;
          }
        });
        setSessionState(newState);
      }

      if (
        response.data.intent === 'schedule_meeting' &&
        !response.data.requiresConfirmation &&
        onScheduleConfirmed
      ) {
        onScheduleConfirmed(sessionState);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Could you try again?',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                  : 'bg-slate-700/50 text-purple-200 border border-purple-500/20 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-60 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 text-purple-200 border border-purple-500/20 px-4 py-3 rounded-xl rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-purple-500/10 p-4 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              mode === 'host'
                ? 'Type your scheduling request...'
                : 'Tell me when you need to meet...'
            }
            className="flex-1 px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg transition-all duration-200 self-end"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
