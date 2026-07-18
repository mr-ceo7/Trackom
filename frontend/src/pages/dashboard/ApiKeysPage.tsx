/**
 * ApiKeysPage - manage API keys with real backend CRUD.
 */
import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Copy, Trash2, CheckCircle2, Shield, X, AlertTriangle, Sliders, Calendar, Globe, Activity, ShieldAlert, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';
import { useAuth } from '../../contexts/AuthContext';


interface ApiKeyData {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scope: string;
  rate_limit: number;
  ip_whitelist: string | null;
  expires_at: string | null;
  max_credits: number | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [scope, setScope] = useState('full_access');
  const [rateLimit, setRateLimit] = useState(60);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxCredits, setMaxCredits] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newFullKey, setNewFullKey] = useState<string | null>(null);
  
  // Stats details state
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);
  const [statsStart, setStatsStart] = useState('');
  const [statsEnd, setStatsEnd] = useState('');
  const [keyStats, setKeyStats] = useState<Record<string, any>>({});
  const [statsLoading, setStatsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (expandedKeyId) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      setStatsStart(formatDate(start));
      setStatsEnd(formatDate(end));
    }
  }, [expandedKeyId]);

  const fetchKeyStats = useCallback(async (keyId: string, start: string, end: string) => {
    setStatsLoading(prev => ({ ...prev, [keyId]: true }));
    try {
      const resp = await api.get(`/api-keys/${keyId}/stats`, {
        params: { start, end }
      });
      setKeyStats(prev => ({ ...prev, [keyId]: resp.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(prev => ({ ...prev, [keyId]: false }));
    }
  }, []);

  useEffect(() => {
    if (expandedKeyId && statsStart && statsEnd) {
      fetchKeyStats(expandedKeyId, statsStart, statsEnd);
    }
  }, [expandedKeyId, statsStart, statsEnd, fetchKeyStats]);

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
    setMaxCredits('');
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
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_credits: maxCredits ? parseFloat(maxCredits) : null
      });
      setNewFullKey(resp.data.full_key);
      setKeyName('');
      setScope('full_access');
      setRateLimit(60);
      setIpWhitelist('');
      setExpiresAt('');
      setMaxCredits('');
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

  const getUsageData = (keyId: string, startStr: string, endStr: string) => {
    const start = startStr ? new Date(startStr) : new Date(Date.now() - 6 * 86400000);
    const end = endStr ? new Date(endStr) : new Date();
    
    const daysDiff = Math.min(30, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const data: { date: string; requests: number; credits: number }[] = [];
    let totalReq = 0;
    let totalCred = 0;
    
    let seed = 0;
    for (let i = 0; i < keyId.length; i++) {
      seed = (seed + keyId.charCodeAt(i)) % 100;
    }
    
    for (let i = 0; i < daysDiff; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      
      const reqSeed = (seed + current.getDate() * 7 + current.getMonth() * 13) % 45;
      const requests = reqSeed + 5; 
      const credits = parseFloat((requests * 0.3).toFixed(2));
      
      data.push({ date: dateStr, requests, credits });
      totalReq += requests;
      totalCred += credits;
    }
    
    return { data, totalReq, totalCred };
  };

  const getLogsData = (keyId: string, count: number) => {
    const endpoints = ['/v1/sms/send', '/v1/messages/history', '/v1/contacts', '/v1/templates'];
    const methods = ['POST', 'GET', 'GET', 'GET'];
    const statuses = [200, 200, 201, 200, 400];
    
    let seed = 0;
    for (let i = 0; i < keyId.length; i++) {
      seed = (seed + keyId.charCodeAt(i)) % 100;
    }
    
    const logs: { timestamp: string; endpoint: string; method: string; status: number; credits: number; ip: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const logTime = new Date(now.getTime() - i * 3600000 * 2.5);
      const indexSeed = (seed + i * 17) % 4;
      const statusSeed = (seed + i * 31) % 5;
      
      const endpoint = endpoints[indexSeed];
      const method = methods[indexSeed];
      const status = statuses[statusSeed];
      const credits = method === 'POST' && status < 300 ? 0.3 : 0.0;
      
      logs.push({
        timestamp: logTime.toLocaleString(),
        endpoint,
        method,
        status,
        credits,
        ip: `197.248.8.${(seed + i * 11) % 254}`
      });
    }
    
    return logs;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">API Keys</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage your API keys for programmatic access.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a 
            href={(api.defaults.baseURL || 'http://localhost:8000/api/v1').replace('/api/v1', '/docs')}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary/15 hover:bg-brand-primary/25 rounded-2xl text-xs font-bold text-brand-primary dark:text-brand-primary-light transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <button onClick={() => { setNewFullKey(null); setShowGenerate(true); }} className="bg-brand-primary hover:bg-brand-primary-hover flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-lg shadow-brand-primary/20 cursor-pointer transition-all">
            <Plus className="w-3.5 h-3.5" />Generate Key
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Security Notice</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">API keys grant full access to your account. Never share them publicly or commit to version control. Rotate keys regularly.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader size="md" /></div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <div 
              key={k.id} 
              onClick={() => setExpandedKeyId(expandedKeyId === k.id ? null : k.id)}
              className="clay-card clay-card-hover rounded-3xl p-5 space-y-3 cursor-pointer transition-all hover:scale-[1.005]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl clay-icon-raised flex items-center justify-center"><Key className="w-5 h-5 text-brand-primary drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{k.name}</h3>
                    <div className="text-[11px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">Created {new Date(k.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(`${k.key_prefix}....................`, k.id); }} className="p-2 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-all" title="Copy Prefix">
                    {copied === k.id ? <CheckCircle2 className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {k.is_active && (
                    <button onClick={(e) => { e.stopPropagation(); handleRevoke(k.id); }} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all" title="Revoke"><Trash2 className="w-4 h-4" /></button>
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

                {k.max_credits !== null && k.max_credits !== undefined ? (
                  <span className="clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 dark:text-brand-primary-light shrink-0">
                    Limit: {k.max_credits.toFixed(2)} KES
                  </span>
                ) : (
                  <span className="clay-pill px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 shrink-0">
                    No Limit
                  </span>
                )}

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

              {expandedKeyId === k.id && (() => {
                const stats = keyStats[k.id];
                const loading = statsLoading[k.id];

                if (loading || !stats) {
                  return (
                    <div className="pt-4 border-t border-slate-200/20 dark:border-white/5 flex flex-col items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-500 dark:text-gray-400 mt-2">Loading statistics...</span>
                    </div>
                  );
                }

                const chartData = stats.chart_data || [];
                const totalReq = stats.total_requests || 0;
                const totalCred = stats.total_credits || 0;
                const successRate = stats.success_rate !== undefined ? `${stats.success_rate.toFixed(1)}%` : '100.0%';
                const logs = stats.recent_logs || [];
                
                const formatTime = (tsStr: string) => {
                  try {
                    const d = new Date(tsStr);
                    if (!isNaN(d.getTime())) {
                      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    }
                  } catch (err) {}
                  return tsStr.split(',')[1] ? tsStr.split(',')[1].trim() : tsStr;
                };

                return (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="pt-4 border-t border-slate-200/20 dark:border-white/5 space-y-5 cursor-default"
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                      <div className="grid grid-cols-3 gap-2 flex-1 max-w-lg">
                        <div className="clay-inset rounded-2xl p-3 flex flex-col justify-center">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Requests</span>
                          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">{totalReq}</span>
                        </div>
                        <div className="clay-inset rounded-2xl p-3 flex flex-col justify-center">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Credits Spent</span>
                          <span className="text-lg font-bold font-mono text-brand-primary mt-0.5">
                            {totalCred.toFixed(2)} KES
                            {k.max_credits ? ` / ${k.max_credits.toFixed(2)}` : ''}
                          </span>
                          {k.max_credits && (
                            <div className="w-full bg-slate-200 dark:bg-slate-700/50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                style={{ width: `${Math.min(100, (totalCred / k.max_credits) * 100)}%` }} 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (totalCred / k.max_credits) >= 0.9 
                                    ? 'bg-red-500' 
                                    : (totalCred / k.max_credits) >= 0.75 
                                    ? 'bg-amber-500' 
                                    : 'bg-brand-primary'
                                }`} 
                              />
                            </div>
                          )}
                        </div>
                        <div className="clay-inset rounded-2xl p-3 flex flex-col justify-center">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Success Rate</span>
                          <span className="text-lg font-bold font-mono text-brand-emerald mt-0.5">{successRate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase">From</span>
                          <input 
                            type="date" 
                            value={statsStart} 
                            onChange={e => setStatsStart(e.target.value)} 
                            className="clay-input px-2.5 py-1.5 rounded-xl text-[11px] text-slate-900 dark:text-white focus:outline-none font-mono" 
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase">To</span>
                          <input 
                            type="date" 
                            value={statsEnd} 
                            onChange={e => setStatsEnd(e.target.value)} 
                            className="clay-input px-2.5 py-1.5 rounded-xl text-[11px] text-slate-900 dark:text-white focus:outline-none font-mono" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-7 space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Daily Request Density</div>
                        <div className="clay-inset rounded-2xl p-4 flex items-end justify-between gap-1.5 h-36 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                          {chartData.map((d: any, idx: number) => {
                            const maxRequests = Math.max(...chartData.map((item: any) => item.requests), 1);
                            const heightPct = (d.requests / maxRequests) * 80 + 10;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end">
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur border border-white/5 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-20 whitespace-nowrap pointer-events-none">
                                  <div className="font-bold text-brand-primary">{d.date}</div>
                                  <div className="flex items-center gap-1 mt-0.5"><Activity className="w-3 h-3 text-cyan-400" /> {d.requests} requests</div>
                                  <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-brand-emerald" /> {d.credits.toFixed(2)} KES cost</div>
                                </div>
                                <div 
                                  style={{ height: `${heightPct}%` }} 
                                  className="w-full bg-brand-primary/60 group-hover:bg-brand-primary/90 rounded-t-md transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                                />
                                <span className="text-[8px] text-slate-400 dark:text-gray-500 mt-1 font-mono shrink-0">
                                  {d.date.split('-')[2]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Recent Request stream</div>
                        <div className="clay-card rounded-2xl border dark:border-white/10 overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 border-b border-slate-200/20 dark:border-white/5 text-[9px] font-bold text-slate-500 dark:text-gray-400 uppercase grid grid-cols-12 gap-1">
                            <div className="col-span-4">Time</div>
                            <div className="col-span-5">Path</div>
                            <div className="col-span-3 text-right">Status</div>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[105px] overflow-y-auto custom-scrollbar text-[10px]">
                            {logs.map((l: any, lIdx: number) => (
                              <div key={lIdx} className="px-3 py-1.5 grid grid-cols-12 gap-1 items-center font-mono">
                                <div className="col-span-4 text-slate-500 dark:text-gray-400 truncate" title={l.timestamp}>{formatTime(l.timestamp)}</div>
                                <div className="col-span-5 text-slate-800 dark:text-slate-300 truncate" title={l.endpoint}>{l.endpoint}</div>
                                <div className="col-span-3 text-right">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${l.status < 300 ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-red-500/10 text-red-500'}`}>
                                    {l.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {logs.length === 0 && (
                              <div className="py-8 text-center text-slate-400">No requests stream recorded.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
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
          <GenieModal onClose={handleCloseModal} className="p-6 space-y-5">
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Max Credit Limit (KES)</label>
                        <input 
                          type="number" 
                          value={maxCredits} 
                          onChange={e => setMaxCredits(e.target.value)} 
                          placeholder="e.g. 500" 
                          min="0"
                          step="0.01"
                          className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs transition-all" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">IP Whitelist</label>
                        <input 
                          type="text" 
                          value={ipWhitelist} 
                          onChange={e => setIpWhitelist(e.target.value)} 
                          placeholder="e.g. 192.168.1.1" 
                          className="clay-input w-full px-4 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-xs transition-all" 
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 -mt-2">Whitelist allowed IPs (comma-separated). Set Max Credits to cap programmatic key budget.</p>
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

                <div className="space-y-2 pt-2 border-t border-slate-200/20 dark:border-white/5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400">Quick Test GET URL (Browser Ready)</label>
                  <div className="relative">
                    <pre className="clay-inset bg-slate-900 rounded-2xl p-4 text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre pr-12">
                      {`${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : 'https://api.trackomgroup.com'}/api/services/sendsms?apikey=${newFullKey}&mobile=${user?.phone || '254712345678'}&message=Hello+from+Trackom!&shortcode=ARVOCAP`}
                    </pre>
                    <button 
                      onClick={() => handleCopy(
                        `${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : 'https://api.trackomgroup.com'}/api/services/sendsms?apikey=${newFullKey}&mobile=${user?.phone || '254712345678'}&message=Hello+from+Trackom!&shortcode=ARVOCAP`, 
                        'get_url'
                      )} 
                      className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer transition-all"
                      title="Copy GET URL"
                    >
                      {copied === 'get_url' ? <CheckCircle2 className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-1">Copy and paste this URL directly into your browser's address bar to send a quick test SMS.</p>
                </div>

                <button onClick={handleCloseModal} className="clay-button-primary w-full py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all">Done</button>
              </div>
            )}
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
