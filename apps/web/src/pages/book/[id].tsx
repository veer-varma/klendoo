import React, { useState } from 'react';
import { useRouter } from 'next/router';
import BookingModeSelector from '@/components/BookingModeSelector';
import SlotsBooking from '@/components/SlotsBooking';
import ChatBooking from '@/components/ChatBooking';
import DirectBooking from '@/components/DirectBooking';

type BookingMode = 'slots' | 'chat' | 'direct';

export default function VisitorBookingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [mode, setMode] = useState<BookingMode>('slots');

  if (!id) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Schedule a Meeting
          </h1>
          <p className="text-purple-300/70 mt-2">Choose how you'd like to book</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
          <BookingModeSelector currentMode={mode} onChange={setMode} />

          {mode === 'slots' && <SlotsBooking meetingId={id as string} />}
          {mode === 'chat' && <ChatBooking meetingId={id as string} />}
          {mode === 'direct' && <DirectBooking meetingId={id as string} />}
        </div>
      </div>
    </div>
  );
}
