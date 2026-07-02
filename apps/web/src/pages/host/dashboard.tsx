import React, { useState } from 'react';
import { useRouter } from 'next/router';
import ChatWindow from '@/components/ChatWindow';

type TabId = 'overview' | 'chat' | 'meetings' | 'bookings' | 'agents' | 'usage' | 'settings';

interface Tab {
  id: TabId;
  label: string;
}

export default function HostDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const hostName = 'Host';

  const tabs: Tab[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'chat', label: '💬 Chat' },
    { id: 'meetings', label: '🔗 Meetings' },
    { id: 'bookings', label: '📋 Bookings' },
    { id: 'agents', label: '🤖 Agents' },
    { id: 'usage', label: '💸 Usage' },
    { id: 'settings', label: '⚙️ Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome, {hostName}
          </h1>
          <p className="text-purple-300/70 mt-2">Manage your meetings and bookings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-purple-500/20 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-700/30 text-purple-300 hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-8">Schedule Meetings with AI</h3>
            <p className="text-purple-300/70 mb-6">
              Use natural language to schedule meetings. Just type what you need!
            </p>
            <ChatWindow hostName={hostName} mode="host" />
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-4">Dashboard Overview</h3>
            <p className="text-purple-300/70">Welcome to your Klendoo dashboard. Select a tab above to get started.</p>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-4">Meetings</h3>
            <p className="text-purple-300/70">Your meetings will appear here.</p>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-4">Bookings</h3>
            <p className="text-purple-300/70">Your bookings will appear here.</p>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-4">AI Agents</h3>
            <p className="text-purple-300/70">Manage your AI agents here.</p>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-4">Usage & Billing</h3>
            <p className="text-purple-300/70">View your usage statistics and billing information.</p>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white mb-4">Settings</h3>
            <p className="text-purple-300/70">Configure your account settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
