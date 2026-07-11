/**
 * SenderIdsPage - manage custom alphanumeric sender ID whitelisting requests.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, Plus, Clock, CheckCircle2, XCircle, Info, HelpCircle, 
  ChevronRight, Calendar, AlertTriangle, ShieldAlert, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';
import { parseApiError } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

interface SenderIdRequest {
  id: string;
  sender_id: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export default function SenderIdsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SenderIdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Form states
  const [newSenderId, setNewSenderId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/sender-ids');
      setRequests(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderId.trim() || !purpose.trim()) return;

    if (newSenderId.trim().length > 11) {
      setError('Sender ID must not exceed 11 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/sender-ids', {
        sender_id: newSenderId.trim().toUpperCase(),
        purpose: purpose.trim()
      });
      setNewSenderId('');
      setPurpose('');
      setShowRequestModal(false);
      await fetchRequests();
    } catch (err: any) {
      setError(parseApiError(err, 'Failed to submit Sender ID request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', text: 'Pending Approval' },
    approved: { icon: CheckCircle2, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10', text: 'Approved' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', text: 'Rejected' },
  };

  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-brand-primary" /> Sender ID Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Register and manage alphanumeric headers for custom outgoing SMS broadcasts.
          </p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="clay-button-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Request Sender ID
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{requests.length}</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">Total Registered</div>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{approvedCount}</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">Active (Approved)</div>
          </div>
        </div>

        <div className="clay-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-slate-900 dark:text-white">{pendingCount}</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">Awaiting Review</div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Help block */}
        <div className="md:col-span-1 space-y-4 order-2 md:order-1">
          <div className="clay-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/20">
              <Info className="w-5 h-5 text-brand-primary" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Compliance Guide</h2>
            </div>
            
            <div className="space-y-3 text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              <p>
                Under regulations set by the Communications Authority of Kenya (CA) and mobile network operators, outgoing bulk messages must utilize whitelisted alphanumeric sender headers.
              </p>
              <p>
                <strong>Rules for custom Sender IDs:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Strictly alphanumeric characters (A-Z, 0-9).</li>
                <li>Maximum length of 11 characters.</li>
                <li>No symbols, punctuation, or spaces.</li>
                <li>Must correspond directly to your registered brand or company name.</li>
              </ul>
              {user?.sandbox_mode && (
                <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-2xl text-[10px] leading-normal flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sandbox Tip:</strong> Requests starting with <code className="font-mono bg-white/40 dark:bg-black/20 px-1 py-0.5 rounded text-[9px]">TEST</code> or <code className="font-mono bg-white/40 dark:bg-black/20 px-1 py-0.5 rounded text-[9px]">DEMO</code> are approved immediately for testing!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="md:col-span-2 space-y-3 order-1 md:order-2">
          {loading ? (
            <div className="text-center py-12 clay-card rounded-3xl"><Loader size="md" /></div>
          ) : (
            <>
              {requests.map(r => {
                const config = statusConfig[r.status] || statusConfig.pending;
                const ConfigIcon = config.icon;
                return (
                  <div 
                    key={r.id}
                    className="clay-card rounded-3xl p-5 hover:border-brand-primary/15 transition-all text-left flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-mono font-bold">
                          {r.sender_id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color} flex items-center gap-1`}>
                          <ConfigIcon className="w-3 h-3" /> {config.text}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 ml-auto sm:ml-0">
                          <Calendar className="w-3 h-3" /> {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-gray-400 pl-0.5">
                        <strong>Purpose:</strong> {r.purpose}
                      </p>

                      {r.status === 'rejected' && r.rejection_reason && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] leading-normal flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                          <span><strong>Rejection Reason:</strong> {r.rejection_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {requests.length === 0 && (
                <div className="text-center py-16 clay-card rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                  <Smartphone className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">No requests submitted</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    Submit your first alphanumeric header registration request using the button above.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <GenieModal as="form" onSubmit={handleSubmit} onClose={() => setShowRequestModal(false)} className="p-6 space-y-4 max-w-md">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/20">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand-primary" /> Request Sender ID Whitelist
              </h3>
              <button type="button" onClick={() => setShowRequestModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sender ID (e.g. MYBRAND)</label>
                <input 
                  type="text"
                  value={newSenderId}
                  onChange={e => setNewSenderId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="MAX 11 ALPHANUMERIC CHARS"
                  required
                  maxLength={11}
                  className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purpose / Use Case</label>
                <textarea 
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Describe your company activity and how you will use this custom header (e.g. sending transactional delivery alerts for my shop)."
                  required
                  rows={4}
                  className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowRequestModal(false)}
                className="clay-button-secondary flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting || !newSenderId || !purpose}
                className="clay-button-primary flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader size="sm" /> : 'Submit Request'}
              </button>
            </div>
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
