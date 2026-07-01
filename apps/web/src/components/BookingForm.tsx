// Copyright (c) 2026 Veer Varma. All rights reserved.

'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface BookingFormProps {
  hostId: string;
  onSuccess?: () => void;
}

export function BookingForm({ hostId, onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    sessionType: 'general',
    preferredTimes: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/bookings', {
        ...formData,
        hostId
      });

      if (response.data.success) {
        setFormData({ visitorName: '', visitorEmail: '', sessionType: 'general', preferredTimes: [] });
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold">Book a Session</h2>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          name="visitorName"
          value={formData.visitorName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="visitorEmail"
          value={formData.visitorEmail}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Session Type</label>
        <select
          name="sessionType"
          value={formData.sessionType}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="general">General</option>
          <option value="coaching">Coaching</option>
          <option value="consultation">Consultation</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Book Now'}
      </button>
    </form>
  );
}
