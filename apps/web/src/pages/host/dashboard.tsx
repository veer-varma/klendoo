import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Meeting {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  shareUrl: string;
  bookingCount: number;
  agents: { reminder: boolean; followUp: boolean };
}

export default function HostDashboard() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [walletBalance, setWalletBalance] = useState(5.0);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [newMeeting, setNewMeeting] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0.05,
  });
  const [agentCosts] = useState({
    booking: 0.05,
    reminder: 0.03,
    followUp: 0.02,
  });
  const [totalSpent, setTotalSpent] = useState(0.0);
  const [agentUsage, setAgentUsage] = useState({
    reminder: 0,
    followUp: 0,
    booking: 0,
  });

  useEffect(() => {
    const host = localStorage.getItem('hostName');
    if (!host) {
      router.push('/host/login');
      return;
    }
    setHostName(host);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await axios.get('/api/bookings');
      setBookings(res.data.bookings || []);

      const storedMeetings = localStorage.getItem('hostMeetings');
      if (storedMeetings) {
        setMeetings(JSON.parse(storedMeetings));
      }

      const storedUsage = localStorage.getItem('agentUsage');
      if (storedUsage) {
        const usage = JSON.parse(storedUsage);
        setAgentUsage(usage);
        setTotalSpent(
          (usage.booking || 0) * agentCosts.booking +
          (usage.reminder || 0) * agentCosts.reminder +
          (usage.followUp || 0) * agentCosts.followUp
        );
      }
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const createMeeting = () => {
    if (!newMeeting.name) {
      alert('Please enter meeting name');
      return;
    }

    const meeting: Meeting = {
      id: 'meeting_' + Date.now(),
      ...newMeeting,
      shareUrl: `${window.location.origin}/book/${Date.now()}`,
      bookingCount: 0,
      agents: { reminder: true, followUp: true },
    };

    const updated = [...meetings, meeting];
    setMeetings(updated);
    localStorage.setItem('hostMeetings', JSON.stringify(updated));

    setNewMeeting({ name: '', description: '', duration: 60, price: 0.05 });
    alert('Meeting created! Share the link with visitors.');
  };

  const toggleAgent = (meetingId: string, agent: 'reminder' | 'followUp') => {
    const updated = meetings.map((m) =>
      m.id === meetingId
        ? { ...m, agents: { ...m.agents, [agent]: !m.agents[agent] } }
        : m
    );
    setMeetings(updated);
    localStorage.setItem('hostMeetings', JSON.stringify(updated));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied!');
  };

  const handleLogout = () => {
    localStorage.removeItem('hostEmail');
    localStorage.removeItem('hostName');
    router.push('/host/login');
  };

  const stats = {
    meetings: meetings.length,
    totalBookings: bookings.length,
    walletBalance,
    monthlySpent: totalSpent,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-black/40 border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎯 Klendoo
            </h1>
            <p className="text-purple-300/70 text-sm mt-1">Calendar & Scheduling Platform</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl px-6 py-4 backdrop-blur">
              <p className="text-green-300/70 text-xs font-semibold uppercase tracking-wide">Wallet Balance</p>
              <p className="text-3xl font-black text-green-400 mt-1">${walletBalance.toFixed(2)}</p>
              <p className="text-green-300/50 text-xs mt-1">USDC</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold border border-red-500/30 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white">Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{hostName}</span>! 👋</h2>
          <p className="text-purple-300/70 mt-2">Manage your meetings, bookings, and automations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-purple-500/20 overflow-x-auto pb-0">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'meetings', label: '🔗 Meetings' },
            { id: 'bookings', label: '📋 Bookings' },
            { id: 'agents', label: '🤖 Agents' },
            { id: 'usage', label: '💸 Usage' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-semibold border-b-2 whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-purple-300/60 hover:text-purple-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Meetings', value: stats.meetings, icon: '🔗', gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
                { label: 'Bookings', value: stats.totalBookings, icon: '📋', gradient: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
                { label: 'Balance', value: `$${stats.walletBalance.toFixed(2)}`, icon: '💰', gradient: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', text: 'text-green-400' },
                { label: 'This Month', value: `$${stats.monthlySpent.toFixed(2)}`, icon: '📊', gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl p-6 backdrop-blur-sm hover:border-opacity-60 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-purple-300/70 font-semibold text-sm uppercase tracking-wide">{stat.label}</p>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className={`text-3xl font-black ${stat.text}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  📋 Recent Bookings
                </h3>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-purple-300/70">No bookings yet</p>
                    <p className="text-purple-300/50 text-sm mt-1">Create a meeting link to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking: any) => (
                      <div key={booking.id} className="bg-slate-700/50 border border-purple-500/10 rounded-xl p-4 hover:bg-slate-700/70 transition-all duration-200">
                        <p className="font-bold text-white">{booking.visitorName || 'Visitor'}</p>
                        <p className="text-purple-300/70 text-sm">{booking.visitorEmail || 'visitor@example.com'}</p>
                        <span className="inline-block mt-3 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-bold border border-green-500/30">
                          ✓ Confirmed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  🔗 Active Meetings
                </h3>
                {meetings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-purple-300/70">No meetings yet</p>
                    <p className="text-purple-300/50 text-sm mt-1">Create one to start accepting bookings!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="bg-slate-700/50 border border-purple-500/10 rounded-xl p-4 hover:bg-slate-700/70 transition-all duration-200">
                        <p className="font-bold text-white">{meeting.name}</p>
                        <p className="text-purple-300/70 text-sm">{meeting.duration} min • ${meeting.price.toFixed(2)}</p>
                        <p className="text-purple-400 text-xs mt-2 font-semibold">{meeting.bookingCount} bookings</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-black text-white mb-8">Create New Meeting</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-purple-300 font-bold mb-3">Meeting Name</label>
                  <input
                    type="text"
                    value={newMeeting.name}
                    onChange={(e) => setNewMeeting({ ...newMeeting, name: e.target.value })}
                    placeholder="e.g., 30-min consultation"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-bold mb-3">Description</label>
                  <textarea
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                    placeholder="Tell visitors what this meeting is about..."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-purple-300 font-bold mb-3">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newMeeting.duration}
                      onChange={(e) => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 font-bold mb-3">Price (USDC)</label>
                    <input
                      type="number"
                      value={newMeeting.price}
                      onChange={(e) => setNewMeeting({ ...newMeeting, price: parseFloat(e.target.value) })}
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={createMeeting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                >
                  ✓ Create Meeting Link
                </button>
              </div>
            </div>

            {meetings.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-2xl font-black text-white mb-8">Your Meeting Links</h3>
                <div className="space-y-6">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-slate-700/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all duration-200">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-lg font-bold text-white">{meeting.name}</p>
                          <p className="text-purple-300/70 text-sm">{meeting.description}</p>
                          <p className="text-purple-400 text-xs mt-2 font-semibold">
                            {meeting.duration} min • ${meeting.price.toFixed(2)} • {meeting.bookingCount} bookings
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-purple-500/10">
                        <p className="text-purple-300/70 text-xs mb-2">Share this link:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={meeting.shareUrl}
                            readOnly
                            className="flex-1 px-4 py-2 bg-slate-700 border border-purple-500/20 rounded-lg text-purple-300 text-sm font-mono"
                          />
                          <button
                            onClick={() => copyToClipboard(meeting.shareUrl)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-4 py-2 rounded-lg border border-purple-500/10 hover:border-purple-500/20 transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={meeting.agents.reminder}
                            onChange={() => toggleAgent(meeting.id, 'reminder')}
                            className="w-4 h-4"
                          />
                          <span className="text-purple-300 text-sm font-semibold">Reminder ($0.03)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 px-4 py-2 rounded-lg border border-purple-500/10 hover:border-purple-500/20 transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={meeting.agents.followUp}
                            onChange={() => toggleAgent(meeting.id, 'followUp')}
                            className="w-4 h-4"
                          />
                          <span className="text-purple-300 text-sm font-semibold">Follow-up ($0.02)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-8">All Bookings</h3>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-purple-300/70">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking: any) => (
                  <div key={booking.id} className="bg-slate-700/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-lg font-bold text-white">{booking.visitorName || 'Visitor'}</p>
                        <p className="text-purple-300/70">{booking.visitorEmail || 'visitor@example.com'}</p>
                      </div>
                      <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg font-bold text-sm border border-green-500/30">
                        ✓ Confirmed
                      </span>
                    </div>
                    <div className="text-sm text-purple-300/70">
                      <p><strong>Type:</strong> {booking.sessionType || 'Session'}</p>
                      <p><strong>Duration:</strong> {booking.duration || 60} minutes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-8">Available Agents</h3>
            <div className="space-y-6">
              {[
                {
                  icon: '📧',
                  name: 'Booking Agent',
                  desc: 'Creates calendar event + sends confirmation',
                  price: '$0.05',
                  color: 'blue',
                  details: 'Runs automatically when someone books'
                },
                {
                  icon: '🔔',
                  name: 'Reminder Agent',
                  desc: 'Sends 1 hour before meeting',
                  price: '$0.03',
                  color: 'green',
                  details: 'Keeps visitors informed before the meeting'
                },
                {
                  icon: '💌',
                  name: 'Follow-up Agent',
                  desc: 'Sends 24 hours after meeting',
                  price: '$0.02',
                  color: 'purple',
                  details: 'Gathers feedback and next steps'
                },
              ].map((agent, i) => (
                <div key={i} className={`bg-gradient-to-br from-${agent.color}-500/10 to-${agent.color}-600/10 border border-${agent.color}-500/30 rounded-xl p-6 hover:border-${agent.color}-500/60 transition-all duration-200`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">{agent.icon}</span>
                        {agent.name}
                      </p>
                      <p className="text-purple-300/70 text-sm mt-1">{agent.desc}</p>
                    </div>
                    <span className={`px-4 py-2 bg-${agent.color}-500/20 text-${agent.color}-300 rounded-lg font-bold text-sm border border-${agent.color}-500/30`}>
                      {agent.price}
                    </span>
                  </div>
                  <p className="text-purple-300/70 text-sm">{agent.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, icon: '💸', gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
                { label: 'Bookings Used', value: agentUsage.booking, icon: '📧', gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
                { label: 'Reminders + Follow-ups', value: agentUsage.reminder + agentUsage.followUp, icon: '🔔', gradient: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl p-6 backdrop-blur-sm`}>
                  <p className="text-purple-300/70 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="text-2xl">{stat.icon}</span>
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-black ${stat.text} mt-3`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-black text-white mb-8">Cost Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: `Booking Agent (${agentUsage.booking} × $0.05)`, amount: (agentUsage.booking * agentCosts.booking).toFixed(2) },
                  { label: `Reminder Agent (${agentUsage.reminder} × $0.03)`, amount: (agentUsage.reminder * agentCosts.reminder).toFixed(2) },
                  { label: `Follow-up Agent (${agentUsage.followUp} × $0.02)`, amount: (agentUsage.followUp * agentCosts.followUp).toFixed(2) },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-purple-500/10 last:border-b-0">
                    <span className="text-purple-300/70">{item.label}</span>
                    <span className="font-bold text-white">${item.amount}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 text-lg font-bold bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-4 mt-4">
                  <span className="text-white">Total</span>
                  <span className="text-purple-400">${totalSpent.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-black text-white mb-8">Wallet Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-purple-300 font-bold mb-3">Your Wallet Address</label>
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-purple-500/20">
                    <p className="font-mono text-sm text-purple-300">ALGO_TESTNET_WALLET_ADDRESS</p>
                  </div>
                </div>
                <div>
                  <label className="block text-purple-300 font-bold mb-3">Current Balance</label>
                  <p className="text-4xl font-black text-green-400">${walletBalance.toFixed(2)} USDC</p>
                </div>
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/50">
                  💳 Fund Wallet
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-black text-white mb-8">Integrations</h3>
              <div className="border border-purple-500/20 rounded-xl p-6 flex justify-between items-center bg-slate-700/50 hover:bg-slate-700/70 transition-all duration-200">
                <div>
                  <p className="font-bold text-white">Google Calendar</p>
                  <p className="text-purple-300/70 text-sm">Sync your bookings automatically</p>
                </div>
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200">
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
