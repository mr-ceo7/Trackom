/**
 * InboxPage - View and manage incoming SMS messages.
 * Includes an inbound SMS gateway simulator and bulk operations.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, Search, MessageSquare, Trash2, Calendar, Phone, 
  UserPlus, RefreshCw, Smartphone, Play, CheckCircle2, AlertCircle, X, ChevronRight, Sliders
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';
import { useAuth } from '../../contexts/AuthContext';

interface IncomingSms {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  gateway_message_id: string | null;
  received_at: string;
  created_at: string;
  contact_name?: string | null;
  contact_id?: string | null;
}

export default function InboxPage() {
  const { user } = useAuth();
  const isSandbox = user?.sandbox_mode !== false;
  const navigate = useNavigate();
  const [messages, setMessages] = useState<IncomingSms[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchSender, setSearchSender] = useState('');
  const [searchRecipient, setSearchRecipient] = useState('');
  const [inputSender, setInputSender] = useState('');
  const [inputRecipient, setInputRecipient] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // Webhook Simulator form state
  const [simSender, setSimSender] = useState('+254712345678');
  const [simRecipient, setSimRecipient] = useState('22045');
  const [simContent, setSimContent] = useState('Hello, this is an incoming message to test the gateway!');
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Add contact modal state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [addingContact, setAddingContact] = useState(false);
  const [addContactError, setAddContactError] = useState<string | null>(null);
  const [addContactSuccess, setAddContactSuccess] = useState<string | null>(null);

  // Bulk selection and filtering
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contactFilter, setContactFilter] = useState('all');

  // Contact groups and Campaign batches filter state
  const [groups, setGroups] = useState<{ id: string, name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');

  // Debounce search filter inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchSender(inputSender);
      setSearchRecipient(inputRecipient);
      setPage(1);
    }, 400); // 400ms debounce delay

    return () => clearTimeout(timer);
  }, [inputSender, inputRecipient]);

  // Clear selections on page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: LIMIT
      };
      if (searchSender.trim()) params.sender = searchSender.trim();
      if (searchRecipient.trim()) params.recipient = searchRecipient.trim();
      if (selectedGroupId) params.group_id = selectedGroupId;
      if (selectedBatch) params.batch_number = selectedBatch;
      
      const resp = await api.get('/messages/incoming', { params });
      setMessages(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [searchSender, searchRecipient, page, selectedGroupId, selectedBatch]);

  const fetchFiltersData = useCallback(async () => {
    try {
      const [groupsResp, batchesResp] = await Promise.all([
        api.get('/contacts/groups'),
        api.get('/messages/incoming/unique-batches')
      ]);
      setGroups(groupsResp.data);
      setBatches(batchesResp.data);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/messages/incoming/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch { /* noop */ }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected messages?`)) return;
    try {
      await api.post('/messages/incoming/bulk-delete', {
        ids: selectedIds
      });
      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    } catch (err: any) {
      alert('Failed to delete selected messages.');
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSender.trim() || !simContent.trim()) return;
    setSimulating(true);
    setSimSuccess(null);
    setSimError(null);

    try {
      await api.post('/messages/incoming/webhook', {
        from: simSender.trim(),
        to: simRecipient.trim() || 'TRACKOM',
        text: simContent.trim(),
        id: `sim-msg-${Math.floor(100000 + Math.random() * 900000)}`
      });
      setSimSuccess('Simulation request triggered successfully! Message received.');
      setSimContent('');
      await fetchMessages();
      await fetchFiltersData(); // Refresh unique batches if simulation added a new batch/number context
    } catch (err: any) {
      setSimError(err.response?.data?.detail || 'Failed to simulate incoming message.');
    } finally {
      setSimulating(false);
    }
  };

  const openAddContactModal = (phone: string) => {
    setContactPhone(phone);
    setContactName('');
    setContactEmail('');
    setAddContactError(null);
    setAddContactSuccess(null);
    setShowAddContact(true);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    setAddingContact(true);
    setAddContactError(null);
    setAddContactSuccess(null);

    try {
      await api.post('/contacts', {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim() || null,
        custom_attributes: {}
      });
      setAddContactSuccess('Contact added successfully!');
      setTimeout(() => {
        setShowAddContact(false);
        fetchMessages();
      }, 1500);
    } catch (err: any) {
      setAddContactError(err.response?.data?.detail || 'Failed to add contact.');
    } finally {
      setAddingContact(false);
    }
  };

  const openReplyModal = (m: IncomingSms) => {
    navigate(`/dashboard/compose?to=${encodeURIComponent(m.sender)}`);
  };

  const openBulkReplyModal = () => {
    const selectedMsgs = messages.filter(m => selectedIds.includes(m.id));
    const uniqueRecipients: string[] = [];
    
    selectedMsgs.forEach(m => {
      if (!uniqueRecipients.includes(m.sender)) {
        uniqueRecipients.push(m.sender);
      }
    });

    if (uniqueRecipients.length === 0) return;

    // Pass comma-separated recipients to Compose page
    navigate(`/dashboard/compose?to=${encodeURIComponent(uniqueRecipients.join(','))}`);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  // Client-side contact filtering
  const filteredMessages = messages.filter(m => {
    if (contactFilter === 'saved') {
      return !!m.contact_name;
    }
    if (contactFilter === 'unsaved') {
      return !m.contact_name;
    }
    return true;
  });

  const isFiltered = inputSender || inputRecipient || selectedGroupId || selectedBatch || contactFilter !== 'all';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-brand-primary" /> Incoming SMS Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            View and reply to incoming messages sent to your shortcodes and virtual numbers.
          </p>
        </div>
        <button 
          onClick={fetchMessages}
          className="clay-button-secondary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-gray-300 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Inbox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Webhook Simulator */}
        {isSandbox && (
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <div className="clay-card rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/20">
                <Smartphone className="w-5 h-5 text-brand-primary" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Gateway Webhook Simulator</h2>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Use this tool to simulate an incoming SMS payload originating from Africa's Talking or other telecommunications gateway webhooks.
              </p>

              <form onSubmit={handleSimulate} className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sender Number (From)</label>
                  <input 
                    type="text"
                    value={simSender}
                    onChange={e => setSimSender(e.target.value)}
                    placeholder="e.g. +254712345678"
                    required
                    className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient (Shortcode / To)</label>
                  <input 
                    type="text"
                    value={simRecipient}
                    onChange={e => setSimRecipient(e.target.value)}
                    placeholder="e.g. 22045 or TRACKOM"
                    required
                    className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Content</label>
                  <textarea 
                    value={simContent}
                    onChange={e => setSimContent(e.target.value)}
                    placeholder="Type simulated incoming message..."
                    required
                    rows={3}
                    className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all resize-none font-sans"
                  />
                </div>

                {simSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{simSuccess}</span>
                  </div>
                )}

                {simError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{simError}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={simulating || !simSender || !simContent}
                  className="clay-button-primary w-full py-2.5 rounded-2xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {simulating ? <Loader size="sm" /> : <><Play className="w-3.5 h-3.5" /> Simulate Inbound SMS</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Column: Inbound SMS List */}
        <div className={`${isSandbox ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4 order-1 lg:order-2`}>

          {/* Filters Card */}
          <div className="clay-card rounded-3xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {filteredMessages.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-500 dark:text-gray-400 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredMessages.length && filteredMessages.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredMessages.map(m => m.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                    />
                    <span>Select All</span>
                  </label>
                )}

                <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search sender number..."
                    value={inputSender}
                    onChange={e => setInputSender(e.target.value)}
                    className="clay-input w-full pl-10 pr-4 py-2 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all"
                  />
                </div>
                
                <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Filter shortcode..."
                    value={inputRecipient}
                    onChange={e => setInputRecipient(e.target.value)}
                    className="clay-input w-full pl-10 pr-4 py-2 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all"
                  />
                </div>

                {/* Saved/Unsaved Filter */}
                <div className="flex items-center gap-1 shrink-0">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={contactFilter}
                    onChange={(e) => {
                      setContactFilter(e.target.value);
                      setPage(1);
                    }}
                    className="clay-input px-3 py-1.5 rounded-xl text-slate-900 dark:text-white focus:outline-none text-xs cursor-pointer"
                  >
                    <option value="all">All Senders</option>
                    <option value="unsaved">Unsaved Only</option>
                    <option value="saved">Contacts Only</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-fade-in shrink-0">
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    {selectedIds.length} selected
                  </span>
                  <button
                    onClick={openBulkReplyModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Reply Selected
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Filters: Groups & Batches */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/20">
              {/* Contact Group Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group:</span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setPage(1);
                  }}
                  className="clay-input px-2.5 py-1.5 rounded-xl text-slate-900 dark:text-white focus:outline-none text-[11px] cursor-pointer min-w-[120px]"
                >
                  <option value="">- All Groups -</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Campaign Batch Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campaign Batch:</span>
                <select
                  value={selectedBatch}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setPage(1);
                  }}
                  className="clay-input px-2.5 py-1.5 rounded-xl text-slate-900 dark:text-white focus:outline-none text-[11px] cursor-pointer min-w-[120px] font-mono"
                >
                  <option value="">- All Batches -</option>
                  {batches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Link */}
              {isFiltered && (
                <button
                  onClick={() => {
                    setInputSender('');
                    setInputRecipient('');
                    setSearchSender('');
                    setSearchRecipient('');
                    setSelectedGroupId('');
                    setSelectedBatch('');
                    setContactFilter('all');
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer ml-auto transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* List content */}
          {loading ? (
            <div className="text-center py-12 clay-card rounded-3xl"><Loader size="md" /></div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map(m => (
                <div 
                  key={m.id}
                  className={`clay-card rounded-3xl p-5 hover:border-brand-primary/20 transition-all text-left flex gap-4 ${
                    selectedIds.includes(m.id) ? 'ring-2 ring-brand-primary/20 bg-brand-primary/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-start pt-1.5 shrink-0">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => handleSelectRow(m.id)}
                      className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {m.contact_name ? (
                        <span className="px-2.5 py-1 rounded-xl bg-brand-emerald/10 text-brand-emerald text-xs font-semibold flex items-center gap-1" title={m.sender}>
                          <Phone className="w-3 h-3" /> {m.contact_name} ({m.sender})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-brand-primary/10 text-brand-primary text-xs font-mono font-bold flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {m.sender}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-mono font-semibold">
                        To: {m.recipient}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0 font-mono">
                        <Calendar className="w-3 h-3" /> {new Date(m.received_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-gray-300 font-sans leading-relaxed whitespace-pre-wrap pl-1 break-words">
                      {m.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200/20 sm:pl-4 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => openReplyModal(m)}
                      className="p-2 rounded-xl text-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Reply to SMS"
                    >
                      <MessageSquare className="w-4 h-4" /> Reply
                    </button>

                    {!m.contact_name && (
                      <button
                        onClick={() => openAddContactModal(m.sender)}
                        className="p-2 rounded-xl text-brand-emerald hover:bg-brand-emerald/5 dark:hover:bg-brand-emerald/10 transition-all cursor-pointer"
                        title="Add to Contacts"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Inbound message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredMessages.length === 0 && (
                <div className="text-center py-16 clay-card rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                  <Inbox className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">No messages found</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    {isFiltered 
                      ? 'There are no messages matching your selected filters.' 
                      : 'Use the Gateway Webhook Simulator on the left to fire a test payload.'}
                  </p>
                </div>
              )}

              {/* Pagination controls */}
              {filteredMessages.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-200/20 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-600 dark:text-gray-400">Page {page}</span>
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={messages.length < LIMIT}
                    className="px-3 py-1.5 rounded-xl clay-button-secondary disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <GenieModal as="form" onSubmit={handleAddContact} onClose={() => setShowAddContact(false)} className="p-6 space-y-4 max-w-md">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/20">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-primary" /> Save Contact
              </h3>
              <button type="button" onClick={() => setShowAddContact(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addContactError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{addContactError}</span>
              </div>
            )}

            {addContactSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{addContactSuccess}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  required
                  readOnly
                  className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-500 focus:outline-none bg-slate-100/50 dark:bg-white/5 font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Name *</label>
                <input 
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  autoFocus
                  className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddContact(false)}
                className="clay-button-secondary flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={addingContact || !contactName}
                className="clay-button-primary flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {addingContact ? <Loader size="sm" /> : 'Save Contact'}
              </button>
            </div>
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
