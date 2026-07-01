import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function HostDashboard() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ bookings: 0, earnings: 0, upcoming: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<Record<string, { start: string; end: string }>>({
    Monday: { start: '09:00', end: '17:00' },
    Tuesday: { start: '09:00', end: '17:00' },
    Wednesday: { start: '09:00', end: '17:00' },
    Thursday: { start: '09:00', end: '17:00' },
    Friday: { start: '09:00', end: '17:00' },
    Saturday: { start: '10:00', end: '14:00' },
    Sunday: { start: '', end: '' },
  });

  useEffect(() => {
    const host = localStorage.getItem('hostName');
    if (!host) {
      router.push('/host/login');
      return;
    }
    setHostName(host);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/bookings');
      setBookings(res.data.bookings || []);
      setStats({
        bookings: res.data.bookings?.length || 0,
        earnings: (res.data.bookings?.length || 0) * 0.05,
        upcoming: Math.floor(Math.random() * 5) + 1,
      });
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hostEmail');
    localStorage.removeItem('hostName');
    router.push('/host/login');
  };

  const saveAvailability = () => {
    localStorage.setItem('hostAvailability', JSON.stringify(weeklyHours));
    alert('Availability saved successfully!');
  };

  const handleHourChange = (day: string, field: 'start' | 'end', value: string) => {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Klendoo Host</h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-semibold px-4 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {hostName}! 👋</h2>
          <p className="text-gray-600 mt-1">Manage your bookings, availability, and earnings</p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'availability', label: '📅 Availability' },
            { id: 'bookings', label: '📋 Bookings' },
            { id: 'calendar', label: '🗓️ Calendar' },
            { id: 'earnings', label: '💰 Earnings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <p className="text-gray-600 font-semibold text-sm">Total Bookings</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">{stats.bookings}</p>
                <p className="text-xs text-gray-500 mt-2">All time</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <p className="text-gray-600 font-semibold text-sm">Total Earnings</p>
                <p className="text-4xl font-bold text-green-600 mt-3">${stats.earnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">USDC</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <p className="text-gray-600 font-semibold text-sm">Upcoming Sessions</p>
                <p className="text-4xl font-bold text-blue-600 mt-3">{stats.upcoming}</p>
                <p className="text-xs text-gray-500 mt-2">Next 7 days</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h3>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">📭 No bookings yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Set your availability to start receiving bookings!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking: any) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.visitorName || 'Visitor'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.visitorEmail || 'visitor@example.com'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        ✓ Confirmed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Your Availability</h3>
            <p className="text-gray-600 mb-6">
              Define your working hours for each day. Visitors can only book during these times.
            </p>
            <div className="space-y-4">
              {Object.entries(weeklyHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <label className="w-32 font-semibold text-gray-700">{day}</label>
                  {hours.start ? (
                    <>
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => handleHourChange(day, 'start', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-600 font-semibold">to</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => handleHourChange(day, 'end', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </>
                  ) : (
                    <span className="text-gray-500 italic">Not available</span>
                  )}
                </div>
              ))}
              <button
                onClick={saveAvailability}
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition"
              >
                ✓ Save Availability
              </button>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Bookings</h3>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">📭 No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {booking.visitorName || 'Visitor'}
                        </p>
                        <p className="text-gray-600">{booking.visitorEmail || 'visitor@example.com'}</p>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                        ✓ Confirmed
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600">Session Type</p>
                        <p className="font-semibold text-gray-900">
                          {booking.sessionType || 'Coaching'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-semibold text-gray-900">{booking.duration || 60} minutes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Connect Google Calendar</h3>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-2">Why connect?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Automatically block off your busy times</li>
                  <li>✓ Prevent double bookings</li>
                  <li>✓ Sync bookings to your calendar</li>
                </ul>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition">
                🔗 Connect Google Calendar
              </button>
              <p className="text-sm text-gray-600">
                Status: <span className="font-semibold text-yellow-600">⚠️ Not Connected</span>
              </p>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Earnings</h3>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-8 text-white shadow-lg">
                <p className="text-sm opacity-90 font-semibold">Total Earned (USDC)</p>
                <p className="text-5xl font-bold mt-3">${stats.earnings.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-8 text-white shadow-lg">
                <p className="text-sm opacity-90 font-semibold">Algorand Wallet</p>
                <p className="text-sm font-mono mt-3 break-all bg-blue-500 bg-opacity-30 rounded p-3">
                  ALGO_TESTNET_WALLET
                </p>
                <p className="text-xs opacity-75 mt-2">Testnet address</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-gray-900 mb-4">Payout Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Fee:</strong> 0% (You keep 100% of earnings!)
                </p>
                <p>
                  <strong>Payment Method:</strong> Direct USDC transfer to your Algorand wallet
                </p>
                <p>
                  <strong>Settlement:</strong> Automatic upon booking confirmation
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
