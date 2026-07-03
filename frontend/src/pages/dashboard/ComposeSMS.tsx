/**
 * ComposeSMS - send SMS to individual numbers or contact groups.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, Hash, MessageSquare, AlertCircle, CheckCircle2, ChevronDown, Clock, Sliders, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader';
import { calculateSmsParts } from '../../utils';


export default function ComposeSMS() {
  const { user, refreshUser } = useAuth();
  const [sendMode, setSendMode] = useState<'single' | 'bulk' | 'group'>('single');
  const [recipients, setRecipients] = useState('');
  const [senderId, setSenderId] = useState('TRACKOM');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Radar Sim States
  const [showRadar, setShowRadar] = useState(false);
  const [radarProgress, setRadarProgress] = useState(0);
  const [radarStatus, setRadarStatus] = useState('');
  const [dispatchedCount, setDispatchedCount] = useState(0);

  // Group selectors
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loadingGroup, setLoadingGroup] = useState(false);

  // Advanced features
  const [batchNumber, setBatchNumber] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  // Reusable templates
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const resp = await api.get('/templates');
      setTemplates(resp.data);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    async function loadGroups() {
      try {
        const resp = await api.get('/contacts/groups');
        setGroups(resp.data);
      } catch { /* noop */ }
    }
    loadGroups();
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !message) return;
    setIsSavingTemplate(true);
    try {
      await api.post('/templates', {
        name: newTemplateName,
        content: message
      });
      setNewTemplateName('');
      setShowSaveTemplateModal(false);
      await fetchTemplates();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save template.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    if (id === '') {
      setMessage('');
      return;
    }
    const selected = templates.find(t => t.id === id);
    if (selected) {
      setMessage(selected.content);
    }
  };

  useEffect(() => {
    if (sendMode !== 'group') {
      return;
    }
    if (!selectedGroupId) {
      setRecipients('');
      return;
    }

    async function loadGroupContacts() {
      setLoadingGroup(true);
      try {
        // Retrieve all contacts belonging to the selected group (or all contacts virtually)
        const params: any = { limit: 10000 };
        if (selectedGroupId !== 'all-contacts') {
          params.group_id = selectedGroupId;
        }
        const resp = await api.get('/contacts', { params });
        const phones = resp.data.map((c: any) => c.phone).join('\n');
        setRecipients(phones);
      } catch {
        setResult({ type: 'error', text: 'Failed to load contacts for the selected group.' });
      } finally {
        setLoadingGroup(false);
      }
    }

    loadGroupContacts();
  }, [selectedGroupId, sendMode]);

  // Reset recipients if switching modes
  const handleModeChange = (mode: 'single' | 'bulk' | 'group') => {
    setSendMode(mode);
    setRecipients('');
    setSelectedGroupId('');
  };


  const { parts: smsCount, charCount, isUnicode } = calculateSmsParts(message);
  const recipientCount = recipients.split(/[\n,;]+/).filter((r) => r.trim()).length;
  const estimatedCost = recipientCount * smsCount;


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setIsSending(true);

    const phones = recipients.split(/[\n,;]+/).map((r) => r.trim()).filter(Boolean);

    if (phones.length === 0) {
      setResult({ type: 'error', text: 'Please enter at least one recipient.' });
      setIsSending(false);
      return;
    }

    if (!message.trim()) {
      setResult({ type: 'error', text: 'Message content cannot be empty.' });
      setIsSending(false);
      return;
    }

    if ((user?.sms_balance || 0) < estimatedCost) {
      setResult({ type: 'error', text: `Insufficient balance. Need ${estimatedCost} credits, you have ${user?.sms_balance?.toLocaleString()}.` });
      setIsSending(false);
      return;
    }

    // Launch Dispatch radar simulation
    setShowRadar(true);
    setRadarProgress(0);
    setRadarStatus('Establishing carrier routing session...');
    setDispatchedCount(phones.length);

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 3;
      if (progress >= 95) progress = 95;
      setRadarProgress(progress);
      
      if (progress < 30) {
        setRadarStatus('Establishing SMPP links...');
      } else if (progress < 65) {
        setRadarStatus('Broadcasting encrypted E.164 payload...');
      } else {
        setRadarStatus('Waiting for carrier delivery webhooks...');
      }
    }, 90);

    try {
      // Force minimum 2.2s animation execution for premium aesthetic
      const [resp] = await Promise.all([
        api.post('/messages/send', {
          recipients: phones,
          message: message,
          sender_id: senderId || 'TRACKOM',
          batch_number: batchNumber || undefined,
          scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
        new Promise(resolve => setTimeout(resolve, 2200))
      ]);

      clearInterval(progressInterval);
      setRadarProgress(100);
      setRadarStatus('Completed successfully!');

      setTimeout(() => {
        setShowRadar(false);
        setResult({ type: 'success', text: isScheduled ? `${phones.length} message(s) scheduled successfully!` : `${phones.length} message(s) queued for delivery successfully!` });
        setRecipients('');
        setMessage('');
        setBatchNumber('');
        setIsScheduled(false);
        setScheduledAt('');
      }, 700);
      await refreshUser();
    } catch (err: any) {
      clearInterval(progressInterval);
      setShowRadar(false);
      setResult({ type: 'error', text: err.response?.data?.detail || 'Failed to send. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Compose SMS</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Send messages to individuals or in bulk.</p>
      </div>

      {/* Result message */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 p-4 rounded-xl border text-sm font-medium ${
              result.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{result.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Message form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sender ID */}
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-primary" /> Sender ID
            </h3>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              maxLength={11}
              className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all"
              placeholder="TRACKOM"
            />
            <p className="text-[11px] text-slate-400 dark:text-gray-500">Max 11 alphanumeric characters. Must be registered with CA Kenya.</p>
          </div>

          {/* Recipients */}
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-accent" /> Recipients
              </h3>
              <div className="clay-inset flex items-center gap-1 rounded-2xl p-0.5">
                {(['single', 'bulk', 'group'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange(mode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize cursor-pointer transition-all ${
                      sendMode === mode ? 'clay-nav-active text-brand-primary shadow-sm' : 'text-slate-500 dark:text-gray-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {sendMode === 'group' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Select Target Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                >
                  <option value="">Select a group</option>
                  <option value="all-contacts">All Contacts</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                readOnly={sendMode === 'group'}
                rows={sendMode === 'single' ? 2 : 5}
                className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all resize-none disabled:opacity-75"
                placeholder={
                  sendMode === 'single'
                    ? '+254712345678'
                    : sendMode === 'bulk'
                    ? '+254712345678\n+254723456789'
                    : 'Select a group to populate phone numbers...'
                }
              />
              {loadingGroup && (
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <Loader size="sm" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-gray-500 flex justify-between items-center">
              <span>
                {sendMode === 'group'
                  ? 'Numbers loaded from the selected contact segment.'
                  : sendMode === 'bulk'
                  ? 'One number per line, or separate with commas.'
                  : 'Enter a single phone number.'}
              </span>
              {recipientCount > 0 && (
                <span className="text-brand-primary font-semibold font-mono">
                  {recipientCount} recipient(s)
                </span>
              )}
            </p>
          </div>

          {/* Message */}
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-emerald" /> Message
              </h3>
              
              <div className="flex items-center gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="clay-input px-3 py-1.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs cursor-pointer max-w-[150px] sm:max-w-none"
                >
                  <option value=""> - Select Template - </option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                
                {message && (
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="clay-button-secondary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0"
                  >
                    Save as Template
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSelectedTemplateId('');
              }}
              rows={5}
              className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none"
              placeholder="Type your message here..."
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-gray-500 font-mono">
              <span>
                {charCount} / {isUnicode ? 70 : 160} characters{' '}
                {isUnicode && (
                  <span className="text-amber-500 font-semibold">(Unicode encoding)</span>
                )}
              </span>
              <span>{smsCount} SMS part(s)</span>
            </div>
          </div>

          {/* Advanced Options (Scheduling & Tracking) */}
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-primary" /> Advanced Options
            </h3>
            
            <div className="space-y-4">
              {/* Batch tracking */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Batch Tracking Number (Optional)
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-Q2"
                  className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs"
                />
              </div>

              {/* Schedule Checkbox */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="scheduleCheckbox"
                  checked={isScheduled}
                  onChange={(e) => {
                    setIsScheduled(e.target.checked);
                    if (!e.target.checked) setScheduledAt('');
                  }}
                  className="w-4 h-4 rounded text-brand-primary border-slate-300 focus:ring-brand-primary cursor-pointer"
                />
                <label htmlFor="scheduleCheckbox" className="text-xs font-semibold text-slate-700 dark:text-gray-300 cursor-pointer select-none">
                  Schedule dispatch for later
                </label>
              </div>

              {/* Datepicker */}
              {isScheduled && (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                    Dispatch Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right - Summary & Send */}
        <div className="space-y-5">
          <div className="clay-card rounded-3xl p-5 space-y-4 sticky top-20">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Summary</h3>

            <div className="space-y-3">
              {[
                { label: 'Sender ID', value: senderId || 'TRACKOM' },
                { label: 'Recipients', value: recipientCount.toString() },
                { label: 'SMS Parts', value: smsCount.toString() },
                { label: 'Est. Credits', value: estimatedCost.toLocaleString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-gray-400">{row.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">{row.value}</span>
                </div>
              ))}

              <div className="h-px bg-slate-200/20 dark:bg-white/6" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400">Your Balance</span>
                <span className="font-bold text-brand-primary font-mono">{user?.sms_balance?.toLocaleString() || '0'}</span>
              </div>

              {estimatedCost > (user?.sms_balance || 0) && estimatedCost > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Insufficient balance</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSending || charCount === 0 || recipientCount === 0}
              className="clay-button-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
            >
              {isSending ? (
                <Loader size="sm" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Delivery typically under 3 seconds</span>
            </div>
          </div>
        </div>
      </form>

      {/* Dispatch Radar Modal */}
      <AnimatePresence>
        {showRadar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border border-indigo-500/25 rounded-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-6 shadow-2xl relative z-10 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">📡 Telecom Dispatcher</span>
                <span className="text-[10px] font-bold text-slate-500">{radarProgress}%</span>
              </div>

              {/* Glowing Radar Sweep */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center border border-indigo-500/10 rounded-full">
                <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full border border-indigo-500/15" />
                <div className="absolute inset-10 rounded-full border border-indigo-500/10" />
                
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                  className="absolute inset-0 origin-center flex items-start justify-center"
                >
                  <div className="w-0.5 h-1/2 bg-gradient-to-t from-transparent to-brand-primary" />
                </motion.div>

                {/* Carrier Node pulsing */}
                <div className="absolute top-2 left-6 w-3.5 h-3.5 rounded-full bg-brand-emerald animate-ping" />
                <div className="absolute top-2 left-6 w-2.5 h-2.5 rounded-full bg-brand-emerald border border-white/20" title="Safaricom Link" />
                
                <div className="absolute bottom-4 right-4 w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                <div className="absolute bottom-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500 border border-white/20" title="Airtel Link" />
                
                <div className="absolute top-10 right-2 w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping" />
                <div className="absolute top-10 right-2 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white/20" title="Telkom Link" />

                <div className="w-3.5 h-3.5 bg-brand-primary rounded-full shadow-lg shadow-brand-primary animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-white font-bold tracking-wide uppercase animate-pulse">
                  {radarStatus}
                </div>
                <div className="text-[9px] text-slate-500">
                  Target: {dispatchedCount} subscribers | E.164 Format
                </div>
              </div>

              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full"
                  animate={{ width: `${radarProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveTemplateModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="clay-card w-full max-w-sm rounded-3xl p-6 relative z-10 text-left dark:bg-[#0c0f1d] dark:border dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 pb-4 mb-4">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Save Message as Template</h3>
                <button type="button" onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Template Title / Name</label>
                  <input 
                    type="text" 
                    value={newTemplateName} 
                    onChange={e => setNewTemplateName(e.target.value)} 
                    placeholder="e.g. Easter Promo, Overdue Alert" 
                    className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none" 
                    required 
                  />
                </div>
                <button type="submit" disabled={isSavingTemplate || !newTemplateName} className="clay-button-primary w-full py-3 rounded-2xl text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                  {isSavingTemplate ? <Loader size="sm" /> : <span>Save Template</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
