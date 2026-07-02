import React from 'react';
import ChatWindow from './ChatWindow';

interface ChatBookingProps {
  meetingId: string;
  onBookingComplete?: (bookingId: string) => void;
}

export default function ChatBooking({ meetingId, onBookingComplete }: ChatBookingProps) {
  const handleScheduleConfirmed = (details: any) => {
    if (onBookingComplete) {
      onBookingComplete(details.bookingId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-700/50 border border-purple-500/10 rounded-lg p-4">
        <p className="text-purple-300 text-sm">
          💡 <strong>Tip:</strong> Tell me what you need. For example: "I need 30 minutes next week for a project discussion"
        </p>
      </div>
      <ChatWindow 
        mode="visitor"
        onScheduleConfirmed={handleScheduleConfirmed}
      />
    </div>
  );
}
