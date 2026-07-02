import React, { useState } from 'react';
import axios from 'axios';

interface DirectBookingProps {
  meetingId: string;
  onRequestSent?: () => void;
}

export default function DirectBooking({ meetingId, onRequestSent }: DirectBookingProps) {
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('30');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!purpose || !visitorName || !visitorEmail) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/booking/request', {
        meetingId,
        purpose,
        duration,
        visitorName,
        visitorEmail,
      });

      setSubmitted(true);
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-3">✅</p>
        <p className="text-white font-bold text-lg">Request Sent!</p>
        <p className="text-purple-300/70 mt-2">The host will review and confirm a time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-purple-300 font-bold mb-2">Meeting Purpose</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="What do you need to discuss?"
          className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-purple-300 font-bold mb-2">How Long? (minutes)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
        </select>
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
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
      >
        {loading ? 'Sending...' : '✓ Send Request'}
      </button>
    </div>
  );
}
