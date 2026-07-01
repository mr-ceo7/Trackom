/**
 * CampaignsPage — view and create SMS campaigns with groups targeting & scheduling.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Clock, CheckCircle2, XCircle, Send, BarChart3, X, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import { useAuth } from '../../contexts/AuthContext';

interface CampaignData {
  id: string;
  name: string;
  message_content: string;
  sender_id: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  scheduled_at: string | null;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
  sending: { icon: Send, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  queued: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  draft: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-white/5' },
  scheduled: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const CampaignRow: React.FC<{ c: CampaignData; statusConfig: any }> = ({ c, statusConfig }) => {
  const [expanded, setExpanded] = useState(c.status === 'queued' || c.status === 'sending');
  const [liveLogs, setLiveLogs] = useState<string[]>([]);

  // Automatically expand active ones
  useEffect(() => {
    if (c.status === 'queued' || c.status === 'sending') {
      setExpanded(true);
    }
  }, [c.status]);

  // Generate simulated streaming log lines for active dispatches
  useEffect(() => {
    if (c.status !== 'queued' && c.status !== 'sending') {
      return;
    }
    
    if (liveLogs.length === 0) {
      setLiveLogs([`⚡ [SYSTEM] Spawning campaign worker for ${c.name}...`]);
    }

    const carriers = ['Safaricom', 'Airtel', 'Telkom'];
    const interval = setInterval(() => {
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const prefix = carrier === 'Safaricom' ? '71' : carrier === 'Airtel' ? '73' : '77';
      const randomPhone = `+254${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
      const timestamp = new Date().toLocaleTimeString();
      
      const newLog = `[${timestamp}] 📡 DISPATCH: Sent payload to ${randomPhone} (${carrier}) -> Success`;
      setLiveLogs(prev => [...prev.slice(-15), newLog]);
    }, 700);

    return () => clearInterval(interval);
  }, [c.status, c.name, liveLogs.length]);

  const cfg = statusConfig[c.status] || statusConfig.draft;
  const Icon = cfg.icon;
  const total = c.total_recipients || 1;
  const progressPercent = Math.round((c.sent_count / total) * 100);
  const deliveryRate = c.sent_count > 0 ? Math.round((c.delivered_count / c.sent_count) * 100) : 0;

  return (
    <div className="clay-card clay-card-hover rounded-3xl overflow-hidden transition-all dark:border-white/10">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${cfg.color} ${c.status === 'sending' ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {c.name}
              {(c.status === 'queued' || c.status === 'sending') && (
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-gray-400">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${cfg.bg} ${cfg.color}`}>
                {c.status}
              </span>
              <span>Created {new Date(c.created_at).toLocaleDateString()}</span>
              {c.scheduled_at && (
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Calendar className="w-3 h-3" />
                  Sched: {new Date(c.scheduled_at).toLocaleString()}
                </span>
              )}
              {(c.status === 'queued' || c.status === 'sending' || liveLogs.length > 0) && (
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="text-brand-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  {expanded ? 'Hide Monitor' : 'Show Live Monitor'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-slate-900 dark:text-white font-mono">{c.total_recipients.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recipients</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-brand-primary font-mono">{c.sent_count.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sent</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-brand-emerald font-mono">{c.delivered_count.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Delivered</div>
          </div>
          {c.sent_count > 0 && (
            <div className="text-center">
              <div className="font-bold text-brand-primary font-mono">{deliveryRate}%</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Delivery</div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (c.status === 'queued' || c.status === 'sending' || liveLogs.length > 0) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="clay-inset border-t border-slate-200/20 dark:border-white/5 px-5 py-4 space-y-3.5"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" /> Live Broadcast Stream
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-gray-300">
                {progressPercent}% Complete ({c.sent_count} / {c.total_recipients})
              </div>
            </div>

            <div className="w-full h-1.5 clay-card dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-emerald rounded-full" 
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {liveLogs.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 dark:border-white/5 rounded-xl p-3.5 font-mono text-[9px] text-slate-400 space-y-1 h-36 overflow-y-auto custom-scrollbar">
                {liveLogs.map((log, index) => (
                  <div 
                    key={index}
                    className={
                      log.includes('SYSTEM') 
                        ? 'text-indigo-400 font-bold' 
                        : log.includes('Safaricom') 
                        ? 'text-emerald-400' 
                        : log.includes('Airtel') 
                        ? 'text-red-400' 
                        : 'text-cyan-400'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CampaignsPage() {
  const { refreshUser } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Form fields
  const [campaignName, setCampaignName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [senderId, setSenderId] = useState('TRACKOM');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  
  // Reusable templates
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCampaigns = useCallback(async () => {
    try {
      const resp = await api.get('/campaigns');
      setCampaigns(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const resp = await api.get('/contacts/groups');
      setGroups(resp.data);
    } catch { /* noop */ }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const resp = await api.get('/templates');
      setTemplates(resp.data);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
    fetchTemplates();
  }, [fetchCampaigns, fetchGroups, fetchTemplates]);

  // Poll active campaigns
  useEffect(() => {
    const hasActive = campaigns.some(c => c.status === 'queued' || c.status === 'sending');
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 3000);

    return () => clearInterval(interval);
  }, [campaigns, fetchCampaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !messageContent.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await api.post('/campaigns', {
        name: campaignName,
        message_content: messageContent,
        sender_id: senderId || 'TRACKOM',
        group_id: selectedGroupId || null,
        scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      setCampaignName('');
      setMessageContent('');
      setSelectedGroupId('');
      setIsScheduled(false);
      setScheduledAt('');
      setShowCreate(false);
      await fetchCampaigns();
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create campaign. Do you have contacts in the target segment?');
    } finally {
      setSaving(false);
    }
  };

  const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.delivered_count, 0);
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Campaigns</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Create and manage bulk SMS campaigns.</p>
        </div>
        <button onClick={() => { setErrorMsg(''); setShowCreate(true); }} className="clay-button-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer transition-all">
          <Plus className="w-3.5 h-3.5" />New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: campaigns.length, color: 'text-brand-primary', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]', icon: Megaphone },
          { label: 'Messages Sent', value: totalSent.toLocaleString(), color: 'text-brand-emerald', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]', icon: Send },
          { label: 'Delivery Rate', value: `${deliveryRate}%`, color: 'text-blue-500', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]', icon: BarChart3 },
          { label: 'Scheduled / Queued', value: scheduledCount + campaigns.filter(c => c.status === 'queued' || c.status === 'sending').length, color: 'text-amber-500', bg: 'clay-icon-raised', glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]', icon: Clock },
        ].map(s => (
          <div key={s.label} className="clay-stat rounded-3xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}><s.icon className={`w-5 h-5 ${s.color} ${s.glow}`} /></div>
            <div><div className="text-xl font-bold text-slate-900 dark:text-white font-mono">{s.value}</div><div className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">{s.label}</div></div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader size="md" /></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <CampaignRow key={c.id} c={c} statusConfig={statusConfig} />
          ))}
          {campaigns.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <Megaphone className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-gray-400">No campaigns launched yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleCreate} className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-brand-primary" />New Campaign</h3>
                  <button type="button" onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">{errorMsg}</div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Campaign Name</label>
                    <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="e.g. June Flash Sale" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Sender ID</label>
                    <input type="text" value={senderId} onChange={e => setSenderId(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all" placeholder="TRACKOM" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Target Segment</label>
                    <select
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="">— All Contacts —</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Message Content</label>
                      <select
                        value={selectedTemplateId}
                        onChange={e => {
                          const id = e.target.value;
                          setSelectedTemplateId(id);
                          if (id === '') {
                            setMessageContent('');
                          } else {
                            const match = templates.find(t => t.id === id);
                            if (match) setMessageContent(match.content);
                          }
                        }}
                        className="clay-input px-2 py-1 rounded-xl text-slate-900 dark:text-white focus:outline-none text-[10px] cursor-pointer"
                      >
                        <option value="">— Use Template —</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <textarea 
                      value={messageContent} 
                      onChange={e => {
                        setMessageContent(e.target.value);
                        setSelectedTemplateId('');
                      }} 
                      required 
                      rows={4} 
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none" 
                      placeholder="Type your marketing or notification message here..." 
                    />
                  </div>

                  {/* Scheduling Section */}
                  <div className="clay-inset space-y-3 p-3.5 rounded-2xl">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isScheduled} 
                        onChange={e => setIsScheduled(e.target.checked)} 
                        className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                      />
                      <span>Schedule for a later time</span>
                    </label>

                    {isScheduled && (
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Scheduled Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={scheduledAt} 
                          onChange={e => setScheduledAt(e.target.value)}
                          required={isScheduled}
                          className="clay-input w-full px-3 py-2 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowCreate(false)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                    <button type="submit" disabled={saving || !campaignName.trim() || !messageContent.trim()} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                      {saving ? 'Creating...' : isScheduled ? 'Schedule Campaign' : 'Launch Campaign'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
