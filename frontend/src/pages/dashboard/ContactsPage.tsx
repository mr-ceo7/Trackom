/**
 * ContactsPage — contact management with CSV import and Group segmenting.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Search, Upload, Trash2, X, UserPlus, 
  FolderPlus, FileSpreadsheet, Layers, AlertCircle, CheckCircle2,
  FolderMinus, Download, Edit3
} from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

interface Contact { 
  id: string; 
  name: string; 
  phone: string; 
  email: string | null; 
  created_at: string; 
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups'>('contacts');
  const [search, setSearch] = useState('');
  
  // Contacts states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newContactGroupId, setNewContactGroupId] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalContactsCount, setTotalContactsCount] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Groups states
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  // CSV Import states
  const [showImport, setShowImport] = useState(false);
  const [importGroupId, setImportGroupId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Mass Editing States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAllTotal, setSelectAllTotal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [bulkName, setBulkName] = useState('');
  const [bulkPhone, setBulkPhone] = useState('');
  const [bulkEmail, setBulkEmail] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  // Clear selection on tab, search, or page navigation
  useEffect(() => {
    setSelectedIds([]);
    setSelectAllTotal(false);
  }, [activeTab, search, page]);

  // Auto-scroll terminal logs to bottom on update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const resp = await api.get('/contacts', { 
        params: {
          page,
          limit,
          ...(search ? { search } : {})
        } 
      });
      setContacts(resp.data);
      const totalHeader = resp.headers['x-total-count'];
      if (totalHeader) {
        setTotalContactsCount(parseInt(totalHeader, 10));
      } else {
        setTotalContactsCount(resp.data.length);
      }
    } catch { /* noop */ }
    finally { setLoadingContacts(false); }
  }, [page, limit, search]);

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const resp = await api.get('/contacts/groups');
      setGroups(resp.data);
    } catch { /* noop */ }
    finally { setLoadingGroups(false); }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Contact Actions
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setSavingContact(true);
    try {
      await api.post('/contacts', { 
        name: newName, 
        phone: newPhone, 
        email: newEmail || null,
        group_id: newContactGroupId || null
      });
      setNewName(''); 
      setNewPhone(''); 
      setNewEmail(''); 
      setNewContactGroupId('');
      setShowAddContact(false);
      await fetchContacts();
    } catch { /* noop */ }
    finally { setSavingContact(false); }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try { 
      await api.delete(`/contacts/${id}`); 
      await fetchContacts(); 
    } catch { /* noop */ }
  };

  const handleBulkExport = async () => {
    try {
      const resp = await api.post(
        '/contacts/export',
        { contact_ids: selectedIds, select_all: selectAllTotal, search: search || null },
        { responseType: 'blob' }
      );
      const blob = new Blob([resp.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trackom_contacts_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export contacts', err);
    }
  };

  const handleBulkDelete = async () => {
    const countToDelete = selectAllTotal ? totalContactsCount : selectedIds.length;
    if (!confirm(`Are you sure you want to delete the ${countToDelete.toLocaleString()} selected contacts?`)) return;
    try {
      await api.post('/contacts/bulk-delete', { 
        contact_ids: selectedIds, 
        select_all: selectAllTotal, 
        search: search || null 
      });
      setSelectedIds([]);
      setSelectAllTotal(false);
      await fetchContacts();
    } catch (err) {
      console.error('Failed to delete contacts', err);
    }
  };

  const handleAssignGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkGroupId) return;
    setBulkUpdating(true);
    setBulkError(null);
    try {
      await api.post('/contacts/bulk-assign-group', {
        contact_ids: selectedIds,
        group_id: bulkGroupId,
        select_all: selectAllTotal,
        search: search || null
      });
      setBulkSuccess('Contacts assigned successfully!');
      setTimeout(() => {
        setShowAssignModal(false);
        setBulkSuccess(null);
        setBulkGroupId('');
        setSelectedIds([]);
        setSelectAllTotal(false);
        fetchContacts();
      }, 1500);
    } catch (err: any) {
      setBulkError(err.response?.data?.detail || 'Failed to assign contacts.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleRemoveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkGroupId) return;
    setBulkUpdating(true);
    setBulkError(null);
    try {
      await api.post('/contacts/bulk-remove-group', {
        contact_ids: selectedIds,
        group_id: bulkGroupId,
        select_all: selectAllTotal,
        search: search || null
      });
      setBulkSuccess('Contacts removed successfully!');
      setTimeout(() => {
        setShowRemoveModal(false);
        setBulkSuccess(null);
        setBulkGroupId('');
        setSelectedIds([]);
        setSelectAllTotal(false);
        fetchContacts();
      }, 1500);
    } catch (err: any) {
      setBulkError(err.response?.data?.detail || 'Failed to remove contacts.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkUpdating(true);
    setBulkError(null);
    
    const update: any = {};
    if (bulkName.trim()) update.name = bulkName.trim();
    if (bulkPhone.trim()) update.phone = bulkPhone.trim();
    if (bulkEmail.trim()) update.email = bulkEmail.trim();

    if (Object.keys(update).length === 0) {
      setBulkError('Please fill in at least one field to update.');
      setBulkUpdating(false);
      return;
    }

    try {
      await api.post('/contacts/bulk-update', {
        contact_ids: selectedIds,
        update,
        select_all: selectAllTotal,
        search: search || null
      });
      setBulkSuccess('Contacts updated successfully!');
      setTimeout(() => {
        setShowBulkEditModal(false);
        setBulkSuccess(null);
        setBulkName('');
        setBulkPhone('');
        setBulkEmail('');
        setSelectedIds([]);
        setSelectAllTotal(false);
        fetchContacts();
      }, 1500);
    } catch (err: any) {
      setBulkError(err.response?.data?.detail || 'Failed to update contacts.');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Group Actions
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    setSavingGroup(true);
    try {
      await api.post('/contacts/groups', {
        name: newGroupName,
        description: newGroupDesc || null
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setShowAddGroup(false);
      await fetchGroups();
    } catch { /* noop */ }
    finally { setSavingGroup(false); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? (Contacts inside won\'t be deleted)')) return;
    try {
      await api.delete(`/contacts/groups/${id}`);
      await fetchGroups();
    } catch { /* noop */ }
  };

  // CSV Import Actions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);

    const importId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setTerminalLogs([
      '⚡ [SYSTEM] Handshaking connection to server event stream...',
      '📂 [FILE] Reading CSV upload buffer...',
    ]);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (importGroupId) {
      formData.append('group_id', importGroupId);
    }

    let eventSource: EventSource | null = null;

    try {
      // 1. Post file cache upload with importId
      await api.post(`/contacts/import?import_id=${importId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. Open Server-Sent Events listener
      const baseURL = api.defaults.baseURL || 'http://localhost:8000/api/v1';
      eventSource = new EventSource(`${baseURL}/contacts/import/stream?import_id=${importId}`);

      eventSource.onmessage = (event) => {
        const msg = event.data;
        setTerminalLogs(prev => [...prev.slice(-40), msg]);

        if (msg.includes('COMPLETE') || msg.includes('FATAL') || msg.includes('❌')) {
          eventSource?.close();
          setImporting(false);
          
          if (msg.includes('COMPLETE')) {
            setImportResult({
              type: 'success',
              text: 'Contacts imported successfully!'
            });
            setSelectedFile(null);
            setImportGroupId('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => {
              setShowImport(false);
              setImportResult(null);
            }, 4000);
            fetchContacts();
          } else {
            setImportResult({
              type: 'error',
              text: 'CSV Import encountered an error.'
            });
          }
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        eventSource?.close();
        setImporting(false);
        setTerminalLogs(prev => [...prev, '❌ [FATAL] Lost connection to server log stream.']);
        setImportResult({
          type: 'error',
          text: 'Connection to stream lost.'
        });
      };

    } catch (err: any) {
      if (eventSource) {
        eventSource.close();
      }
      setImporting(false);
      setTerminalLogs(prev => [
        ...prev,
        `❌ [FATAL] Failed to initialize import: ${err.response?.data?.detail || err.message}`
      ]);
      setImportResult({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to upload CSV.'
      });
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Contacts & Groups</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            {activeTab === 'contacts' ? `${totalContactsCount.toLocaleString()} contacts total` : `${groups.length} lists/segments`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => { setImportResult(null); setShowImport(true); }}
            className="clay-button-secondary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-gray-300 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button 
            onClick={() => setShowAddGroup(true)}
            className="clay-button-secondary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-gray-300 cursor-pointer transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Group
          </button>
          <button 
            onClick={() => setShowAddContact(true)} 
            className="clay-button-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/6">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${activeTab === 'contacts' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800'}`}
        >
          All Contacts
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${activeTab === 'groups' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800'}`}
        >
          Groups/Segments
        </button>
      </div>

      {/* Search and Table / Grid */}
      {activeTab === 'contacts' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="clay-input w-full pl-11 pr-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
              placeholder="Search contacts..." 
            />
          </div>

          {selectedIds.length === contacts.length && totalContactsCount > contacts.length && (
            <div className="clay-card rounded-2xl p-4 flex items-center justify-between gap-4 transition-all">
              <div className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                {selectAllTotal ? (
                  <span>All <strong>{totalContactsCount.toLocaleString()}</strong> contacts matching the query are selected.</span>
                ) : (
                  <span>All <strong>{contacts.length}</strong> contacts on this page are selected.</span>
                )}
              </div>
              {selectAllTotal ? (
                <button
                  type="button"
                  onClick={() => { setSelectedIds([]); setSelectAllTotal(false); }}
                  className="clay-button-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 cursor-pointer"
                >
                  Clear Selection
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectAllTotal(true)}
                  className="clay-button-primary px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                >
                  Select all {totalContactsCount.toLocaleString()} contacts
                </button>
              )}
            </div>
          )}

          {loadingContacts ? (
            <div className="text-center py-12"><Loader size="md" /></div>
          ) : (
            <div className="clay-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/20 dark:border-white/6 clay-inset">
                      <th className="px-5 py-3.5 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                          checked={contacts.length > 0 && contacts.every(c => selectedIds.includes(c.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(contacts.map(c => c.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Name</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Phone</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider hidden sm:table-cell">Email</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <motion.tr 
                        key={c.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: Math.min(i * 0.015, 0.5) }} 
                        className="clay-row-hover border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                            checked={selectedIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, c.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== c.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center text-brand-primary text-xs font-bold shrink-0">
                              {c.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600 dark:text-gray-400 font-mono">{c.phone}</td>
                        <td className="px-5 py-3 text-sm text-slate-500 hidden sm:table-cell">{c.email || '—'}</td>
                        <td className="px-5 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteContact(c.id)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {contacts.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-gray-400">No contacts found.</p>
                </div>
              )}

              {totalContactsCount > 0 && (
                <div className="clay-inset px-5 py-4 border-t border-slate-200/20 dark:border-white/6 flex items-center justify-between flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-gray-400 rounded-b-3xl">
                  <div>
                    Showing <span className="text-slate-900 dark:text-white font-bold">{((page - 1) * limit) + 1}</span> to{' '}
                    <span className="text-slate-900 dark:text-white font-bold">{Math.min(page * limit, totalContactsCount)}</span> of{' '}
                    <span className="text-slate-900 dark:text-white font-bold">{totalContactsCount.toLocaleString()}</span> contacts
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="clay-button-secondary px-3 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * limit >= totalContactsCount}
                      className="clay-button-secondary px-3 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Groups View */
        <div className="space-y-4">
          {loadingGroups ? (
            <div className="text-center py-12"><Loader size="md" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <div key={g.id} className="clay-card clay-card-hover rounded-3xl p-5 flex flex-col justify-between dark:border-white/10 relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-primary" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed min-h-[32px]">
                      {g.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/20 dark:border-white/5 mt-4 pt-3 text-[11px] text-slate-400">
                    <span>Created {new Date(g.created_at).toLocaleDateString()}</span>
                    <button 
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="col-span-full text-center py-16 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <Layers className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-gray-400">No segments created yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showImport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowImport(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-brand-primary" />Import Contacts (CSV)
                  </h3>
                  <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                {importResult && (
                  <div className={`p-3 border text-xs rounded-xl flex items-start gap-2 ${
                    importResult.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {importResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{importResult.text}</span>
                  </div>
                )}

                {importing || (importResult?.type === 'success' && terminalLogs.length > 0) ? (
                  /* TERMINAL LOG STREAM VIEW */
                  <div className="space-y-4">
                    <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 font-mono text-[10px] text-emerald-400 h-64 overflow-y-auto space-y-1 custom-scrollbar">
                      {terminalLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className={
                            log.startsWith('⚠️') 
                              ? 'text-yellow-500' 
                              : log.startsWith('⚡') || log.startsWith('✨') 
                              ? 'text-cyan-400 font-bold' 
                              : log.startsWith('❌') 
                              ? 'text-red-500 font-bold' 
                              : 'text-emerald-400'
                          }
                        >
                          {log}
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                    <div className="text-[10px] text-slate-400 text-center font-mono animate-pulse">
                      {importing ? '⚡ Sanity check streaming in progress...' : '✨ Upload stream verified successfully.'}
                    </div>
                  </div>
                ) : (
                  /* STANDARD IMPORT FORM */
                  <form onSubmit={handleImportCSV} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Select CSV File</label>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange} 
                        accept=".csv"
                        required
                        className="clay-input w-full px-3 py-2 rounded-2xl text-sm text-slate-800 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"
                      />
                      <p className="text-[10px] text-slate-400">Headers like 'name', 'phone' and 'email' are auto-detected. Format Kenya numbers as +254... or 07...</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Target Group (Optional)</label>
                      <select
                        value={importGroupId}
                        onChange={e => setImportGroupId(e.target.value)}
                        className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                      >
                        <option value="">— No group (All Contacts) —</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="clay-inset rounded-2xl p-3.5 text-[11px] text-slate-500 leading-normal flex gap-2">
                      <AlertCircle className="w-4 h-4 text-brand-primary shrink-0" />
                      <span>
                        <strong>Async Upload Optimizations:</strong> Large CSV files are processed asynchronously in the background. Duplicate phone numbers and empty lines are skipped automatically.
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowImport(false)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                      <button 
                        type="submit" 
                        disabled={importing || !selectedFile} 
                        className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {importing ? <Loader size="sm" /> : <span>Import</span>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddContact(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleAddContact} className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-brand-primary" />Add Contact</h3>
                  <button type="button" onClick={() => setShowAddContact(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name *</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="John Doe" /></div>
                  <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone *</label><input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all" placeholder="+254712345678" /></div>
                  <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="email@example.com" /></div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Add to Group</label>
                    <select
                      value={newContactGroupId}
                      onChange={e => setNewContactGroupId(e.target.value)}
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                    >
                      <option value="">— No group (Unsorted) —</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddContact(false)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                  <button type="submit" disabled={savingContact || !newName || !newPhone} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                    {savingContact ? <Loader size="sm" /> : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Group Modal */}
      <AnimatePresence>
        {showAddGroup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddGroup(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleAddGroup} className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2"><FolderPlus className="w-5 h-5 text-brand-primary" />Create Contact Group</h3>
                  <button type="button" onClick={() => setShowAddGroup(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Group Name *</label><input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" placeholder="e.g. VIP Customers" /></div>
                  <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Description</label><textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} rows={3} className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none" placeholder="Briefly describe who is in this segment..." /></div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddGroup(false)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                  <button type="submit" disabled={savingGroup || !newGroupName} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                    {savingGroup ? <Loader size="sm" /> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Mass Action Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
          >
            <div className="clay-toolbar rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="clay-inset px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-brand-primary dark:text-brand-primary">
                  {selectAllTotal ? totalContactsCount.toLocaleString() : selectedIds.length}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">contacts selected</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="clay-btn-blue flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Bulk Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Edit</span>
                </button>

                <button
                  onClick={() => setShowAssignModal(true)}
                  className="clay-btn-indigo flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Assign to Group"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Assign</span>
                </button>

                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="clay-btn-orange flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Remove from Group"
                >
                  <FolderMinus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Remove</span>
                </button>

                <button
                  onClick={handleBulkExport}
                  className="clay-btn-emerald flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Export CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export</span>
                </button>

                <button
                  onClick={handleBulkDelete}
                  className="clay-btn-red flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Delete Selected"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Delete</span>
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />

                <button
                  onClick={() => setSelectedIds([])}
                  className="clay-button-secondary p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-all"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign to Group Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowAssignModal(false); setBulkError(null); setBulkSuccess(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleAssignGroup} className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-brand-primary" />
                    Assign Group ({selectedIds.length} contacts)
                  </h3>
                  <button type="button" onClick={() => { setShowAssignModal(false); setBulkError(null); setBulkSuccess(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {bulkError && (
                  <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccess && (
                  <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Select Group</label>
                  <select
                    value={bulkGroupId}
                    onChange={e => setBulkGroupId(e.target.value)}
                    required
                    className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="">— Choose a group —</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowAssignModal(false); setBulkError(null); setBulkSuccess(null); }} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                  <button type="submit" disabled={bulkUpdating || !bulkGroupId} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                    {bulkUpdating ? <Loader size="sm" /> : 'Assign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove from Group Modal */}
      <AnimatePresence>
        {showRemoveModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowRemoveModal(false); setBulkError(null); setBulkSuccess(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleRemoveGroup} className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderMinus className="w-5 h-5 text-orange-500" />
                    Remove from Group ({selectedIds.length} contacts)
                  </h3>
                  <button type="button" onClick={() => { setShowRemoveModal(false); setBulkError(null); setBulkSuccess(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {bulkError && (
                  <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccess && (
                  <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Select Group</label>
                  <select
                    value={bulkGroupId}
                    onChange={e => setBulkGroupId(e.target.value)}
                    required
                    className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="">— Choose a group —</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowRemoveModal(false); setBulkError(null); setBulkSuccess(null); }} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                  <button type="submit" disabled={bulkUpdating || !bulkGroupId} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                    {bulkUpdating ? <Loader size="sm" /> : 'Remove'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {showBulkEditModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowBulkEditModal(false); setBulkError(null); setBulkSuccess(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleBulkUpdate} className="clay-card rounded-3xl dark:border dark:border-white/10 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-blue-500" />
                    Bulk Edit ({selectedIds.length} contacts)
                  </h3>
                  <button type="button" onClick={() => { setShowBulkEditModal(false); setBulkError(null); setBulkSuccess(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {bulkError && (
                  <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccess && (
                  <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bulkSuccess}</span>
                  </div>
                )}

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-3 text-[11px] text-blue-600 dark:text-blue-400 leading-normal">
                  <strong>Note:</strong> Only filled fields will be updated across all selected contacts. Leave fields empty if you don't want to modify them.
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Full Name</label>
                    <input
                      type="text"
                      value={bulkName}
                      onChange={e => setBulkName(e.target.value)}
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Phone</label>
                    <input
                      type="tel"
                      value={bulkPhone}
                      onChange={e => setBulkPhone(e.target.value)}
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all"
                      placeholder="+254712345678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Email</label>
                    <input
                      type="email"
                      value={bulkEmail}
                      onChange={e => setBulkEmail(e.target.value)}
                      className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowBulkEditModal(false); setBulkError(null); setBulkSuccess(null); }} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
                  <button type="submit" disabled={bulkUpdating} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                    {bulkUpdating ? <Loader size="sm" /> : 'Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
