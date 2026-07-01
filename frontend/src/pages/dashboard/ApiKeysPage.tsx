/**
 * ApiKeysPage — manage API keys with real backend CRUD.
 */
import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Copy, Trash2, CheckCircle2, Shield, X, AlertTriangle, Sliders, Calendar, Globe, Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';

interface ApiKeyData {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scope: string;
  rate_limit: number;
  ip_whitelist: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [scope, setScope] = useState('full_access');
  const [rateLimit, setRateLimit] = useState(60);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newFullKey, setNewFullKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const resp = await api.get('/api-keys');
      setKeys(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleCloseModal = () => {
    setShowGenerate(false);
    setKeyName('');
    setScope('full_access');
    setRateLimit(60);
    setIpWhitelist('');
    setExpiresAt('');
    setShowAdvanced(false);
  };

  const handleGenerate = async () => {
    if (!keyName.trim()) return;
    setGenerating(true);
    try {
      const resp = await api.post('/api-keys', { 
        name: keyName,
        scope,
        rate_limit: rateLimit,
        ip_whitelist: ipWhitelist.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      });
      setNewFullKey(resp.data.full_key);
      setKeyName('');
      setScope('full_access');
      setRateLimit(60);
      setIpWhitelist('');
      setExpiresAt('');
      setShowAdvanced(false);
      await fetchKeys();
    } catch { /* noop */ }
    finally { setGenerating(false); }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      await fetchKeys();
    } catch { /* noop */ }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">API Keys</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage your API keys for programmatic access.</p>
        </div>
        <button onClick={() => { setNewFullKey(null); setShowGenerate(true); }} className="clay-button-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer transition-all">
          <Plus className="w-3.5 h-3.5" />Generate Key
        </button>
      </div>

      <div className="clay-card rounded-3xl p-5 flex items-start gap-3 border-l-4 border-brand-primary">
        <Shield className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Security Notice</h4>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">API keys grant full access to your account. Never share them publicly or commit to version control. Rotate keys regularly.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader size="md" /></div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="clay-card clay-card-hover rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl clay-icon-raised flex items-center justify-center"><Key className="w-5 h-5 text-brand-primary drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{k.name}</h3>
                    <div className="text-[11px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">Created {new Date(k.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleCopy(`${k.key_prefix}....................`, k.id)} className="p-2 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-all" title="Copy Prefix">
                    {copied === k.id ? <CheckCircle2 className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {k.is_active && (
                    <button onClick={() => handleRevoke(k.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all" title="Revoke"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <code className="clay-inset px-3 py-1.5 rounded-2xl text-slate-600 dark:text-gray-400 font-mono">{k.key_prefix}••••••••••••••••</code>
                
                <span className="text-slate-400 font-medium shrink-0">{k.usage_count.toLocaleString()} requests</span>
                
                <span className={`clay-pill px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                  k.scope === 'send_only' 
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                    : k.scope === 'read_only' 
                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' 
                    : 'bg-brand-primary/15 text-brand-primary dark:text-brand-primary-light'
                }`}>
                  {k.scope === 'send_only' ? 'Send Only' : k.scope === 'read_only' ? 'Read Only' : 'Full Access'}
                </span>

                <span className="clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-gray-400 shrink-0">
                  {k.rate_limit} req/min
                </span>

                {k.ip_whitelist ? (
                  <span className="clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold text-amber-600 bg-amber-500/10 dark:text-amber-400 shrink-0 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Restricted IP
                  </span>
                ) : (
                  <span className="clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 shrink-0 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" /> Any IP
                  </span>
                )}

                {k.expires_at ? (
                  <span className={`clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 flex items-center gap-1 ${
                    new Date(k.expires_at).getTime() < Date.now() 
                      ? 'bg-red-500/10 text-red-500' 
                      : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                  }`}>
                    <Calendar className="w-3 h-3" /> 
                    {new Date(k.expires_at).getTime() < Date.now() ? 'Expired' : `Expires ${new Date(k.expires_at).toLocaleDateString()}`}
                  </span>
                ) : (
                  <span className="clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 shrink-0 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> No Expiry
                  </span>
                )}

                <span className={`clay-pill px-2 py-0.5 rounded-md text-[10px] font-bold ${k.is_active ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'} shrink-0`}>
                  {k.is_active ? 'Active' : 'Revoked'}
                </span>
              </div>
            </div>
          ))}
          {keys.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <Key className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-gray-400">No API keys created yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Generate API Key Modal */}
      <AnimatePresence>
        {showGenerate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="clay-card rounded-3xl dark:border dark:border-white/10 shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2"><Key className="w-5 h-5 text-brand-primary" />Generate API Key</h3>
                  <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                {!newFullKey ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Key Name</label>
                      <input type="text" value={keyName} onChange={e => setKeyName(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="e.g. Production Backend" />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)} 
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{showAdvanced ? 'Hide Advanced Config' : 'Show Advanced Config'}</span>
                      </button>
                    </div>

                    {showAdvanced && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-slate-200/20 dark:border-white/5"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Permissions (Scope)</label>
                          <select 
                            value={scope} 
                            onChange={e => setScope(e.target.value)} 
                            className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs cursor-pointer"
                          >
                            <option value="full_access">Full Access (Read, Write, Send)</option>
                            <option value="send_only">Send SMS Only</option>
                            <option value="read_only">Read Only (Reports & History)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Rate Limit (req/min)</label>
                            <input 
                              type="number" 
                              value={rateLimit} 
                              onChange={e => setRateLimit(Number(e.target.value))} 
                              min="0"
                              className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs transition-all" 
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Expiration Date</label>
                            <input 
                              type="date" 
                              value={expiresAt} 
                              onChange={e => setExpiresAt(e.target.value)} 
                              className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs transition-all font-mono" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">IP Whitelist</label>
                          <input 
                            type="text" 
                            value={ipWhitelist} 
                            onChange={e => setIpWhitelist(e.target.value)} 
                            placeholder="e.g. 192.168.1.1, 10.0.0.0/24" 
                            className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs transition-all" 
                          />
                          <p className="text-[10px] text-slate-400 dark:text-gray-500">Comma-separated list of allowed IPs or CIDR blocks. Leave blank to allow any IP address.</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCloseModal} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                      <button onClick={handleGenerate} disabled={generating || !keyName.trim()} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                        {generating ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="clay-inset p-3 rounded-2xl text-amber-500 text-xs flex gap-2 items-start">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Make sure to copy your API key now. You won't be able to see it again for security reasons.</span>
                    </div>
                    <div className="relative">
                      <pre className="clay-inset bg-slate-900 rounded-2xl p-4 text-xs text-slate-200 font-mono break-all pr-12">{newFullKey}</pre>
                      <button onClick={() => handleCopy(newFullKey, 'new_key')} className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer transition-all">
                        {copied === 'new_key' ? <CheckCircle2 className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={handleCloseModal} className="clay-button-primary w-full py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all">Done</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
