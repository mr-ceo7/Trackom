/**
 * CampaignsPage - view and create SMS campaigns with groups targeting & scheduling.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Megaphone, Plus, Clock, CheckCircle2, XCircle, Send, BarChart3, X, Calendar, Users, Edit, Trash2, Pause, Play, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';

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
  total_cost: number;
  scheduled_at: string | null;
  group_id: string | null;
  include_opt_out: boolean;
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
  paused: { icon: Pause, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  cancelled: { icon: Ban, color: 'text-slate-400', bg: 'bg-slate-200/10 dark:bg-white/5' },
};

const getCarrierFromPhone = (phone: string): string => {
  const clean = phone.replace(/[^0-9]/g, '');
  let localNum = clean;
  if (localNum.startsWith('254')) {
    localNum = localNum.slice(3);
  } else if (localNum.startsWith('0')) {
    localNum = localNum.slice(1);
  }
  
  if (/^(70|71|72|74|79|110|111|112|113|114|115)/.test(localNum)) {
    return 'Safaricom';
  }
  if (/^(73|75|78|100|101|102)/.test(localNum)) {
    return 'Airtel';
  }
  if (/^(77|104)/.test(localNum)) {
    return 'Telkom';
  }
  return 'Safaricom';
};

const CampaignRow: React.FC<{ 
  c: CampaignData; 
  statusConfig: any;
  onDelete: (id: string) => Promise<void>;
  onResend: (id: string) => Promise<void>;
  onEdit: (c: CampaignData) => void;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}> = ({ c, statusConfig, onDelete, onResend, onEdit, onPause, onResume, onCancel }) => {
  const [expanded, setExpanded] = useState(c.status === 'queued' || c.status === 'sending' || c.status === 'paused');
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Automatically expand active ones
  useEffect(() => {
    if (c.status === 'queued' || c.status === 'sending' || c.status === 'paused') {
      setExpanded(true);
    }
  }, [c.status]);

  // Load real logs from the API
  useEffect(() => {
    if (!expanded) return;
    
    const isActive = c.status === 'queued' || c.status === 'sending' || c.status === 'paused';
    
    const fetchLogs = async () => {
      try {
        const resp = await api.get('/messages/history', {
          params: {
            campaign_id: c.id,
            limit: 100
          }
        });
        
        const messages = [...resp.data].reverse();
        const formattedLogs: string[] = [];
        formattedLogs.push(`⚡ [SYSTEM] Spawning campaign worker for ${c.name}...`);
        
        messages.forEach((msg: any) => {
          const timestamp = new Date(msg.created_at).toLocaleTimeString();
          const carrier = getCarrierFromPhone(msg.recipient);
          let statusStr = 'Success';
          if (msg.status === 'failed' || msg.status === 'rejected') {
            statusStr = `Failed${msg.error_message ? `: ${msg.error_message}` : ''}`;
          } else if (msg.status === 'queued') {
            statusStr = 'Queued';
          } else if (msg.status === 'scheduled') {
            statusStr = 'Scheduled';
          }
          
          formattedLogs.push(`[${timestamp}] 📡 DISPATCH: Sent payload to ${msg.recipient} (${carrier}) -> ${statusStr}`);
        });
        
        setLiveLogs(formattedLogs);
      } catch (err) {
        console.error("Failed to fetch campaign logs:", err);
      }
    };

    fetchLogs();
    
    if (!isActive) return;

    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [c.status, c.id, c.name, expanded]);

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [liveLogs]);

  const cfg = statusConfig[c.status] || statusConfig.draft;
  const Icon = cfg.icon;
  const total = c.total_recipients || 1;
  const progressPercent = Math.round((c.sent_count / total) * 100);
  const deliveryRate = c.sent_count > 0 ? Math.round((c.delivered_count / c.sent_count) * 100) : 0;

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="clay-card clay-card-hover rounded-3xl overflow-hidden transition-all dark:border-white/10 cursor-pointer text-left"
    >
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
              <span className="text-brand-primary font-semibold flex items-center gap-1">
                {expanded ? 'Hide Details' : 'Show Details'}
              </span>
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

          {/* Action buttons */}
          <div className="flex items-center gap-1 border-l border-slate-200/20 dark:border-white/5 pl-4 shrink-0">
            {/* Pause/Resume for active campaigns */}
            {c.status === 'sending' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onPause(c.id); }}
                className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 cursor-pointer transition-all"
                title="Pause Campaign"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {c.status === 'paused' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onResume(c.id); }}
                className="p-2 rounded-xl text-brand-emerald hover:bg-brand-emerald/10 cursor-pointer transition-all"
                title="Resume Campaign"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {/* Cancel for active/scheduled/paused campaigns */}
            {(c.status === 'sending' || c.status === 'paused' || c.status === 'scheduled') && (
              <button 
                onClick={(e) => { e.stopPropagation(); onCancel(c.id); }}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all"
                title="Cancel Campaign"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
            {/* Existing Edit button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(c); }}
              className="p-2 rounded-xl text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 cursor-pointer transition-all"
              title={c.status === 'draft' || c.status === 'scheduled' ? "Edit Campaign" : "Edit & Resend"}
            >
              <Edit className="w-4 h-4" />
            </button>
            {(c.status !== 'sending' && c.status !== 'queued' && c.status !== 'paused') && (
              <button 
                onClick={(e) => { e.stopPropagation(); onResend(c.id); }}
                className="p-2 rounded-xl text-slate-400 hover:text-brand-emerald hover:bg-brand-emerald/5 dark:hover:bg-brand-emerald/10 cursor-pointer transition-all"
                title="Resend Campaign"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 cursor-pointer transition-all"
              title="Delete Campaign"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="clay-inset border-t border-slate-200/20 dark:border-white/5 px-5 py-4 space-y-4"
            onClick={(e) => e.stopPropagation()} // Prevent collapse on content click
          >
            {(c.status === 'queued' || c.status === 'sending' || c.status === 'paused') ? (
              <div className="space-y-3.5">
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

                {c.status === 'paused' && (
                  <div className="flex items-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-semibold">
                    <Pause className="w-3.5 h-3.5" />
                    Campaign paused — {c.sent_count} of {c.total_recipients} messages sent so far
                  </div>
                )}

                {liveLogs.length > 0 && (
                  <div ref={logContainerRef} className="bg-slate-950 border border-slate-800 dark:border-white/5 rounded-xl p-3.5 font-mono text-[9px] text-slate-400 space-y-1 h-36 overflow-y-auto custom-scrollbar">
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
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message Body</span>
                    <p className="text-xs text-slate-700 dark:text-gray-300 font-sans leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-white/5 p-3 rounded-2xl">
                      {c.message_content}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Details</span>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-gray-400">
                      <div><strong className="text-slate-800 dark:text-gray-200">Sender ID:</strong> <span className="font-mono">{c.sender_id}</span></div>
                      <div><strong className="text-slate-800 dark:text-gray-200">Targeting Segment:</strong> {c.group_id ? "Group Segment" : "All Contacts"}</div>
                      <div><strong className="text-slate-800 dark:text-gray-200">Credits Spent:</strong> <span className="font-mono">{c.total_cost} cr</span></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamps</span>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-gray-400">
                      <div><strong className="text-slate-800 dark:text-gray-200">Created:</strong> {new Date(c.created_at).toLocaleString()}</div>
                      {c.scheduled_at && <div><strong className="text-slate-800 dark:text-gray-200">Scheduled:</strong> {new Date(c.scheduled_at).toLocaleString()}</div>}
                    </div>
                  </div>
                </div>
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
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  
  // Form fields
  const [campaignName, setCampaignName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [senderId, setSenderId] = useState('');
  const [senderIds, setSenderIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [includeOptOut, setIncludeOptOut] = useState(true);
  
  // Reusable templates
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Campaign Modal State
  const [editingCampaign, setEditingCampaign] = useState<CampaignData | null>(null);
  const [editName, setEditName] = useState('');
  const [editMessageContent, setEditMessageContent] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editIsScheduled, setEditIsScheduled] = useState(false);
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editSelectedTemplateId, setEditSelectedTemplateId] = useState('');
  const [editIncludeOptOut, setEditIncludeOptOut] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const openEditModal = (c: CampaignData) => {
    setEditingCampaign(c);
    setEditName(c.name);
    setEditMessageContent(c.message_content);
    setEditGroupId(c.group_id || '');
    setEditIsScheduled(!!c.scheduled_at);
    if (c.scheduled_at) {
      const date = new Date(c.scheduled_at);
      const formatted = date.toISOString().slice(0, 16);
      setEditScheduledAt(formatted);
    } else {
      setEditScheduledAt('');
    }
    setEditIncludeOptOut(c.include_opt_out);
    setEditSelectedTemplateId('');
    setEditErrorMsg('');
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setEditSaving(true);
    setEditErrorMsg('');
    try {
      const isDraftOrScheduled = editingCampaign.status === 'draft' || editingCampaign.status === 'scheduled';
      
      if (isDraftOrScheduled) {
        await api.put(`/campaigns/${editingCampaign.id}`, {
          name: editName,
          message_content: editMessageContent,
          group_id: editGroupId || null,
          scheduled_at: editIsScheduled && editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
          include_opt_out: editIncludeOptOut,
        });
      } else {
        // Edit and Launch/Resend as a new campaign run!
        await api.post(`/campaigns`, {
          name: editName.startsWith('Resend: ') ? editName : `Resend: ${editName}`,
          message_content: editMessageContent,
          group_id: editGroupId || null,
          sender_id: editingCampaign.sender_id,
          scheduled_at: editIsScheduled && editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
          include_opt_out: editIncludeOptOut,
        });
      }
      setEditingCampaign(null);
      await fetchCampaigns();
      await refreshUser();
    } catch (err: any) {
      setEditErrorMsg(err.response?.data?.detail || 'Failed to save or resend campaign.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign history?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete campaign.');
    }
  };

  const handleResendCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to duplicate and resend this campaign?')) return;
    try {
      await api.post(`/campaigns/${id}/resend`);
      await fetchCampaigns();
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to resend campaign.');
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to pause campaign.');
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/resume`);
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to resume campaign.');
    }
  };

  const handleCancelCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this campaign? This cannot be undone. Unused credits will be refunded.')) return;
    try {
      await api.post(`/campaigns/${id}/cancel`);
      await fetchCampaigns();
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel campaign.');
    }
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/campaigns', {
        params: {
          page,
          limit: LIMIT
        }
      });
      setCampaigns(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [page]);

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

  const fetchSenderIds = useCallback(async () => {
    try {
      const resp = await api.get('/sender-ids/approved');
      setSenderIds(resp.data);
      if (resp.data && resp.data.length > 0) {
        setSenderId(resp.data[0]);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
    fetchTemplates();
    fetchSenderIds();
  }, [fetchCampaigns, fetchGroups, fetchTemplates, fetchSenderIds]);

  // Poll active campaigns
  useEffect(() => {
    const hasActive = campaigns.some(c => c.status === 'queued' || c.status === 'sending' || c.status === 'paused');
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
        sender_id: senderId,
        group_id: selectedGroupId || null,
        scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        include_opt_out: includeOptOut,
      });
      setCampaignName('');
      setMessageContent('');
      setSelectedGroupId('');
      setIsScheduled(false);
      setScheduledAt('');
      setIncludeOptOut(true);
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
            <CampaignRow 
              key={c.id} 
              c={c} 
              statusConfig={statusConfig} 
              onDelete={handleDeleteCampaign}
              onResend={handleResendCampaign}
              onEdit={openEditModal}
              onPause={handlePauseCampaign}
              onResume={handleResumeCampaign}
              onCancel={handleCancelCampaign}
            />
          ))}
          {campaigns.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <Megaphone className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-gray-400">No campaigns launched yet.</p>
            </div>
          )}

          {/* Pagination controls */}
          {campaigns.length > 0 && (
            <div className="px-5 py-3 flex items-center justify-between text-xs text-slate-500">
              <button 
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer transition-all"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-600 dark:text-gray-400">Page {page}</span>
              <button 
                type="button"
                onClick={() => setPage(p => p + 1)}
                disabled={campaigns.length < LIMIT}
                className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreate && (
          <GenieModal as="form" onSubmit={handleCreate} onClose={() => setShowCreate(false)} className="p-6 space-y-5">
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
                <select
                  value={senderId}
                  onChange={e => setSenderId(e.target.value)}
                  required
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all cursor-pointer"
                >
                  {senderIds.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Target Segment</label>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                >
                  <option value="">All Contacts</option>
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
                    <option value="">Use Template</option>
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

              {/* Opt-out Footer Option */}
              <div className="clay-inset p-3.5 rounded-2xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeOptOut} 
                    onChange={e => setIncludeOptOut(e.target.checked)} 
                    className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Auto-append opt-out footer (<span className="font-mono text-[10px]">*456*9*5#</span>)</span>
                </label>
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
          </GenieModal>
        )}
      </AnimatePresence>
      {/* Edit Campaign Modal */}
      <AnimatePresence>
        {editingCampaign && (
          <GenieModal as="form" onSubmit={handleUpdateCampaign} onClose={() => setEditingCampaign(null)} className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-primary" />
                {editingCampaign.status === 'draft' || editingCampaign.status === 'scheduled' ? 'Edit Campaign' : 'Edit & Resend Campaign'}
              </h3>
              <button type="button" onClick={() => setEditingCampaign(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">{editErrorMsg}</div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Campaign Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  required 
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
                  placeholder="e.g. June Flash Sale" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Target Segment</label>
                <select
                  value={editGroupId}
                  onChange={e => setEditGroupId(e.target.value)}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                >
                  <option value="">All Contacts</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Message Content</label>
                  <select
                    value={editSelectedTemplateId}
                    onChange={e => {
                      const id = e.target.value;
                      setEditSelectedTemplateId(id);
                      if (id === '') {
                        setEditMessageContent('');
                      } else {
                        const match = templates.find(t => t.id === id);
                        if (match) setEditMessageContent(match.content);
                      }
                    }}
                    className="clay-input px-2 py-1 rounded-xl text-slate-900 dark:text-white focus:outline-none text-[10px] cursor-pointer"
                  >
                    <option value="">Use Template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <textarea 
                  value={editMessageContent} 
                  onChange={e => {
                    setEditMessageContent(e.target.value);
                    setEditSelectedTemplateId('');
                  }} 
                  required 
                  rows={4} 
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none" 
                  placeholder="Type your marketing or notification message here..." 
                />
              </div>

              {/* Opt-out Footer Option */}
              <div className="clay-inset p-3.5 rounded-2xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editIncludeOptOut} 
                    onChange={e => setEditIncludeOptOut(e.target.checked)} 
                    className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Auto-append opt-out footer (<span className="font-mono text-[10px]">*456*9*5#</span>)</span>
                </label>
              </div>

              {/* Scheduling Section */}
              <div className="clay-inset space-y-3 p-3.5 rounded-2xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editIsScheduled} 
                    onChange={e => setEditIsScheduled(e.target.checked)} 
                    className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Schedule for a later time</span>
                </label>

                {editIsScheduled && (
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Scheduled Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={editScheduledAt} 
                      onChange={e => setEditScheduledAt(e.target.value)}
                      required={editIsScheduled}
                      className="clay-input w-full px-3 py-2 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingCampaign(null)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                <button type="submit" disabled={editSaving || !editName.trim() || !editMessageContent.trim()} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                  {editSaving ? 'Saving...' : editIsScheduled ? 'Schedule Campaign' : (editingCampaign.status === 'draft' || editingCampaign.status === 'scheduled' ? 'Save Changes' : 'Launch Campaign')}
                </button>
              </div>
            </div>
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
