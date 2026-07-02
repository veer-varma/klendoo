import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SlotsBookingProps {
  meetingId: string;
  onBookingComplete?: (bookingId: string) => void;
}

export default function SlotsBooking({ meetingId, onBookingComplete }: SlotsBookingProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [meetingId]);

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`/api/booking/slots?meetingId=${meetingId}`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !visitorName || !visitorEmail) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/booking/create', {
        meetingId,
        slot: selectedSlot,
        visitorName,
        visitorEmail,
        mode: 'slots',
      });

      if (onBookingComplete) {
        onBookingComplete(response.data.bookingId);
      }
      alert('Booking confirmed! Check your email.');
    } catch (error) {
      console.error('Failed to book:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-purple-300 font-bold mb-3">Available Times</label>
        <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {slots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSlot === slot.id
                  ? 'border-purple-500 bg-purple-600/20'
                  : 'border-purple-500/20 bg-slate-700/30 hover:border-purple-500/40'
              }`}
            >
              <p className="font-bold text-white">{slot.date}</p>
              <p className="text-purple-300">{slot.startTime} - {slot.endTime}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">Your Name</label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">Email</label>
        <input
          type="email"
          value={visitorEmail}
          onChange={(e) => setVisitorEmail(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
          placeholder="john@example.com"
        />
      </div>

      <button
        onClick={handleBook}
        disabled={!selectedSlot || loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
      >
        {loading ? 'Booking...' : '✓ Confirm Booking'}
      </button>
    </div>
  );
}
