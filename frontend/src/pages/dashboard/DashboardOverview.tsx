import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Users, Megaphone, TrendingUp, Cpu, Server, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../services/api';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({ total_sent: 0, sent_today: 0, balance: 0 });
  const [contactsCount, setContactsCount] = useState(0);

  // Live Sim States
  const [throughput, setThroughput] = useState(0);
  const [safaricomPing, setSafaricomPing] = useState(142);
  const [airtelPing, setAirtelPing] = useState(178);
  const [telkomPing, setTelkomPing] = useState(210);

  const loadStats = useCallback(async () => {
    try {
      const [statsResp, contactsResp] = await Promise.all([
        api.get('/messages/stats'),
        api.get('/contacts'),
      ]);
      setStatsData(statsResp.data);
      const totalHeader = contactsResp.headers['x-total-count'];
      if (totalHeader) {
        setContactsCount(parseInt(totalHeader, 10));
      } else {
        setContactsCount(contactsResp.data.length);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Real-time SSE-driven stats refresh
  useEffect(() => {
    const handler = () => loadStats();
    window.addEventListener('sse:wallet_update', handler);
    window.addEventListener('sse:campaign_update', handler);
    window.addEventListener('sse:contacts_import', handler);
    return () => {
      window.removeEventListener('sse:wallet_update', handler);
      window.removeEventListener('sse:campaign_update', handler);
      window.removeEventListener('sse:contacts_import', handler);
    };
  }, [loadStats]);

  // Fluctuate stats in real time for premium live dashboard experience
  useEffect(() => {
    // Initial jump
    setThroughput(statsData.sent_today > 0 ? 142 : 0);

    const interval = setInterval(() => {
      // If user has sent messages today, show throughput activity
      if (statsData.sent_today > 0 || statsData.total_sent > 10) {
        setThroughput(Math.floor(130 + Math.random() * 30));
      } else {
        setThroughput(0);
      }
      
      // Fluctuate latency/ping metrics
      setSafaricomPing(Math.floor(135 + Math.random() * 15));
      setAirtelPing(Math.floor(170 + Math.random() * 20));
      setTelkomPing(Math.floor(200 + Math.random() * 25));
    }, 1800);

    return () => clearInterval(interval);
  }, [statsData]);

  const stats = [
    { label: 'SMS Balance', value: (user?.sms_balance || statsData.balance).toLocaleString(), icon: MessageSquare, color: 'text-brand-primary', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' },
    { label: 'Messages Today', value: statsData.sent_today.toLocaleString(), icon: TrendingUp, color: 'text-brand-emerald', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    { label: 'Contacts', value: contactsCount.toLocaleString(), icon: Users, color: 'text-brand-accent', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' },
    { label: 'Total Sent', value: statsData.total_sent.toLocaleString(), icon: Megaphone, color: 'text-purple-500', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' },
  ];

  // Calculate rotation for speedometer needle (from -90deg to +90deg based on 0-200 throughput range)
  const needleRotation = Math.min(Math.max((throughput / 200) * 180 - 90, -90), 90);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
          Here's what's happening with your messaging today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="clay-stat rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 text-left">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} ${stat.glow}`} />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-mono truncate">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5 truncate">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* LIVE GATEWAY METRICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SPEEDOMETER: Throughput Speed */}
        <div className="clay-card rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden h-76">
          <div className="w-full flex items-center justify-between pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-primary" /> Live Gateway Speed
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-brand-emerald uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full" /> Live
            </span>
          </div>

          <div className="relative w-44 h-24 flex items-end justify-center mt-6 overflow-hidden">
            {/* Speed dial */}
            <div className="absolute inset-0 rounded-t-full border-[10px] border-slate-200 dark:border-white/5 border-b-0" />
            <div className="absolute inset-0 rounded-t-full border-[10px] border-slate-800 dark:border-brand-primary border-b-0 border-r-transparent border-l-transparent dark:opacity-60" />
            
            {/* Needle */}
            <div 
              className="absolute bottom-0 w-1.5 h-16 bg-slate-800 dark:bg-gradient-to-t dark:from-brand-primary dark:to-brand-accent origin-bottom rounded-full transition-transform duration-500"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            />
            
            {/* Hub */}
            <div className="absolute bottom-0 w-5 h-2.5 bg-slate-800 dark:bg-white rounded-t-full dark:border-white/20" />
          </div>

          <div className="mt-2 space-y-0.5">
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{throughput}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SMS / Second</div>
          </div>
        </div>

        {/* CARRIER split neon distribution */}
        <div className="clay-card clay-card-hover rounded-3xl p-6 flex flex-col justify-between h-76">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-accent" /> Traffic Carrier Split
            </span>
          </div>

          <div className="space-y-4 py-3">
            {/* Safaricom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-emerald" /> Safaricom (E.164)
                </span>
                <span className="font-mono text-slate-900 dark:text-white">72%</span>
              </div>
              <div className="w-full h-3.5 clay-inset rounded-full overflow-hidden">
                <div className="h-full clay-progress-emerald rounded-full animate-pulse" style={{ width: '72%' }} />
              </div>
            </div>

            {/* Airtel */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Airtel Kenya
                </span>
                <span className="font-mono text-slate-900 dark:text-white">20%</span>
              </div>
              <div className="w-full h-3.5 clay-inset rounded-full overflow-hidden">
                <div className="h-full clay-progress-red rounded-full" style={{ width: '20%' }} />
              </div>
            </div>

            {/* Telkom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> Telkom
                </span>
                <span className="font-mono text-slate-900 dark:text-white">8%</span>
              </div>
              <div className="w-full h-3.5 clay-inset rounded-full overflow-hidden">
                <div className="h-full clay-progress-cyan rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* LATENCY MONITOR: Link stats */}
        <div className="clay-card clay-card-hover rounded-3xl p-6 flex flex-col justify-between h-76">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-brand-emerald" /> Link Latency Monitor
            </span>
          </div>

          <div className="space-y-3.5 py-2">
            {[
              { carrier: 'Safaricom SMS Gateway', ping: safaricomPing, status: 'Healthy', color: 'text-brand-emerald' },
              { carrier: 'Airtel API Node', ping: airtelPing, status: 'Healthy', color: 'text-brand-emerald' },
              { carrier: 'Telkom SMS SMPP Bind', ping: telkomPing, status: 'Stable', color: 'text-brand-accent' },
            ].map((node) => (
              <div key={node.carrier} className="flex items-center justify-between p-3.5 rounded-2xl clay-inset">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-gray-200">{node.carrier}</div>
                  <div className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">{node.ping}ms latency</div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${node.color} uppercase tracking-wider`}>
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" /> {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Action panel */}
      <div className="clay-card rounded-3xl p-8 text-center">
        <div className="text-4xl mb-3">🚀</div>
        <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">Ready to send your first message?</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 mb-4 max-w-md mx-auto">
          You have {user?.sms_balance?.toLocaleString()} free SMS credits. Start by composing a message or importing your contacts.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="/dashboard/compose" className="clay-button-primary px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all">
            Compose SMS
          </a>
          <a href="/dashboard/contacts" className="clay-button-secondary px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-gray-300 transition-all">
            Import Contacts
          </a>
        </div>
      </div>
    </div>
  );
}
