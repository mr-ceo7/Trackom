/**
 * TemplatesPage - View, create, edit, and delete SMS templates.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Edit2, Trash2, X, AlertCircle, CheckCircle2, 
  Send, HelpCircle, Code, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';
import { calculateSmsParts } from '../../utils';

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/templates');
      setTemplates(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const resp = await api.get('/contacts?limit=200');
      setContacts(resp.data.contacts || resp.data || []);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, [fetchTemplates, fetchContacts]);

  const availablePlaceholders = useMemo(() => {
    const base = ['{{name}}', '{{phone}}', '{{email}}'];
    const customKeys = new Set<string>();
    contacts.forEach((c: any) => {
      if (c.custom_attributes && typeof c.custom_attributes === 'object') {
        Object.keys(c.custom_attributes).forEach(key => customKeys.add(key));
      }
    });
    return [...base, ...Array.from(customKeys).map(key => `{{${key}}}`)]; 
  }, [contacts]);

  const insertPlaceholder = (ph: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + ph);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newContent = text.substring(0, start) + ph + text.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + ph.length, start + ph.length);
    }, 0);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/templates', { name: name.trim(), content: content.trim() });
      setSuccess('Template created successfully!');
      setTimeout(() => {
        setShowCreateModal(false);
        setName('');
        setContent('');
        setSuccess(null);
        fetchTemplates();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create template.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/templates/${editingTemplate.id}`, { name: name.trim(), content: content.trim() });
      setSuccess('Template updated successfully!');
      setTimeout(() => {
        setEditingTemplate(null);
        setName('');
        setContent('');
        setSuccess(null);
        fetchTemplates();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      await fetchTemplates();
    } catch { /* noop */ }
  };

  const openEditModal = (t: SmsTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setContent(t.content);
    setError(null);
    setSuccess(null);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic template preview attributes
  const renderContentPreview = (text: string) => {
    const parts = text.split(/(\{\{[a-zA-Z0-9_]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span key={index} className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">SMS Templates</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage reusable message segments and personalized campaigns.</p>
        </div>

        <button 
          onClick={() => {
            setName('');
            setContent('');
            setError(null);
            setSuccess(null);
            setShowCreateModal(true);
          }}
          className="clay-button-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Template
        </button>
      </div>

      {/* Info Notice about placeholders */}
      <div className="clay-card rounded-2xl p-4 bg-brand-primary/5 border border-brand-primary/10 flex gap-3 text-xs leading-normal">
        <HelpCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="text-slate-600 dark:text-gray-300 space-y-1">
          <span className="font-semibold text-slate-900 dark:text-white">Personalization Tip:</span>
          <p>
            You can inject contact custom variables dynamically into your template by wrapping the attribute name in double curly braces. 
            For example: <code className="font-mono font-bold bg-slate-200/50 dark:bg-white/10 px-1 py-0.5 rounded text-brand-primary">{"Dear {{name}}, your balance is {{balance}}"}</code>.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clay-input w-full pl-11 pr-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all shadow-sm" 
          placeholder="Search templates by name or content..." 
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTemplates.map((t, idx) => {
              const { charCount, parts } = calculateSmsParts(t.content);
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                  className="clay-card rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all border border-slate-200/50 dark:border-white/5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                        {t.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-white/[0.01] p-3.5 rounded-2xl border border-slate-100 dark:border-white/[0.02]">
                      {renderContentPreview(t.content)}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-gray-500">
                      <span>Chars: <strong className="text-slate-600 dark:text-gray-300 font-mono">{charCount}</strong></span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                      <span>SMS Parts: <strong className="text-slate-600 dark:text-gray-300 font-mono">{parts}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.03] pt-4 mt-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 cursor-pointer transition-all"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => navigate(`/dashboard/compose?template_id=${t.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white bg-brand-primary hover:bg-brand-primary-hover transition-all cursor-pointer shadow-sm shadow-brand-primary/10 active:scale-[0.98]"
                    >
                      <Send className="w-3 h-3" />
                      Use Template
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-20 clay-card rounded-3xl">
              <FileText className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">No templates found</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Try refining your search query or create a new template.</p>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <GenieModal as="form" onSubmit={handleCreate} onClose={() => setShowCreateModal(false)} className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" /> Create Template
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400">Template Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
                  placeholder="e.g. Balance Reminder" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400">Message Content *</label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {calculateSmsParts(content).charCount} chars
                  </span>
                </div>
                <textarea 
                  ref={textareaRef}
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  required 
                  rows={5}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none font-sans" 
                  placeholder="e.g. Dear {{name}}, your balance is {{balance}}." 
                />

                {/* Clickable placeholder chips */}
                {availablePlaceholders.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500 uppercase mr-1">Insert:</span>
                    {availablePlaceholders.map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => insertPlaceholder(ph)}
                        className="clay-pill px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-brand-primary hover:bg-brand-primary/10 transition-all cursor-pointer"
                      >
                        {ph}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Visual statistics */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-gray-500 px-1 pt-1">
                  <span>SMS Parts: <strong className="text-slate-600 dark:text-gray-300 font-mono">{calculateSmsParts(content).parts}</strong></span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Code className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Support custom attributes wrapping</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
              <button type="submit" disabled={saving || !name || !content} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                {saving ? <Loader size="sm" /> : 'Save Template'}
              </button>
            </div>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTemplate && (
          <GenieModal as="form" onSubmit={handleUpdate} onClose={() => setEditingTemplate(null)} className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" /> Edit Template
              </h3>
              <button type="button" onClick={() => setEditingTemplate(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400">Template Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all" 
                  placeholder="e.g. Balance Reminder" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400">Message Content *</label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {calculateSmsParts(content).charCount} chars
                  </span>
                </div>
                <textarea 
                  ref={textareaRef}
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  required 
                  rows={5}
                  className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none font-sans" 
                  placeholder="e.g. Dear {{name}}, your balance is {{balance}}." 
                />

                {/* Clickable placeholder chips */}
                {availablePlaceholders.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500 uppercase mr-1">Insert:</span>
                    {availablePlaceholders.map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => insertPlaceholder(ph)}
                        className="clay-pill px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-brand-primary hover:bg-brand-primary/10 transition-all cursor-pointer"
                      >
                        {ph}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-gray-500 px-1 pt-1">
                  <span>SMS Parts: <strong className="text-slate-600 dark:text-gray-300 font-mono">{calculateSmsParts(content).parts}</strong></span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Code className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Support custom attributes wrapping</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingTemplate(null)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
              <button type="submit" disabled={saving || !name || !content} className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-50">
                {saving ? <Loader size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
