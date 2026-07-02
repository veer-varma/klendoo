import React from 'react';

type BookingMode = 'slots' | 'chat' | 'direct';

interface BookingModeSelectorProps {
  currentMode: BookingMode;
  onChange: (mode: BookingMode) => void;
}

export default function BookingModeSelector({ currentMode, onChange }: BookingModeSelectorProps) {
  const modes: Array<{ id: BookingMode; icon: string; label: string; desc: string }> = [
    {
      id: 'slots',
      icon: '📅',
      label: 'Pick a Time',
      desc: 'Select from available time slots',
    },
    {
      id: 'chat',
      icon: '💬',
      label: 'Chat',
      desc: 'Tell me what you need',
    },
    {
      id: 'direct',
      icon: '📝',
      label: 'Request',
      desc: 'Send a meeting request',
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
            currentMode === mode.id
              ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
              : 'bg-slate-700/30 border-purple-500/20 hover:border-purple-500/40'
          }`}
        >
          <div className="text-3xl mb-2">{mode.icon}</div>
          <p className="font-bold text-white">{mode.label}</p>
          <p className="text-sm text-purple-300/70 mt-1">{mode.desc}</p>
        </button>
      ))}
    </div>
  );
}
