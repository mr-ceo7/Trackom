/**
 * ComposeSMS - send SMS to individual numbers or contact groups.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, Hash, MessageSquare, AlertCircle, CheckCircle2, ChevronDown, Clock, Sliders, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader';
import GenieModal from '../../components/GenieModal';

import { calculateSmsParts } from '../../utils';
import DateTimePicker from '../../components/DateTimePicker';
import * as XLSX from 'xlsx';


const formatErrorDetail = (detail: any): string => {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(err => {
      const loc = Array.isArray(err.loc) ? err.loc.join('.') : err.loc;
      return `${loc}: ${err.msg}`;
    }).join(', ');
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return String(detail);
};

export default function ComposeSMS() {

  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; actionText?: string; actionPath?: string } | null>(null);
  const [sendMode, setSendMode] = useState<'single' | 'bulk' | 'group'>('single');
  const [recipients, setRecipients] = useState('');
  const [senderId, setSenderId] = useState('');
  const [senderIds, setSenderIds] = useState<string[]>([]);

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
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [loadedContacts, setLoadedContacts] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // CSV Import mapping states
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRow, setCsvPreviewRow] = useState<Record<string, string> | null>(null);
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [isLocalUploadActive, setIsLocalUploadActive] = useState(false);
  const [directCsvFile, setDirectCsvFile] = useState<File | null>(null);
  const [directCsvGroupName, setDirectCsvGroupName] = useState<string>('');
  const [estimatedContactsCount, setEstimatedContactsCount] = useState<number | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const resp = await api.get('/contacts/groups');
      setGroups(resp.data);
    } catch { /* noop */ }
  }, []);

  const countCSVLines = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      let linesCount = 0;
      const chunkSize = 1024 * 1024; // 1MB chunks
      let offset = 0;

      const readNextChunk = () => {
        if (offset >= file.size) {
          resolve(linesCount > 0 ? linesCount - 1 : 0); // subtract header
          return;
        }
        const slice = file.slice(offset, offset + chunkSize);
        reader.onload = (e) => {
          const text = e.target?.result as string || '';
          const matches = text.match(/\n/g);
          if (matches) {
            linesCount += matches.length;
          }
          offset += chunkSize;
          readNextChunk();
        };
        reader.readAsText(slice);
      };

      readNextChunk();
    });
  };

  const parseCSVPreview = (file: File): Promise<{ headers: string[], preview: Record<string, string> }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const slice = file.slice(0, 10240); // Read first 10KB
      reader.onload = (e) => {
        const text = e.target?.result as string || '';
        const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          resolve({ headers: [], preview: {} });
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        const preview: Record<string, string> = {};
        if (lines.length > 1) {
          const firstRowValues = lines[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
          headers.forEach((h, idx) => {
            if (h) preview[h] = firstRowValues[idx] || '';
          });
        }
        resolve({ headers, preview });
      };
      reader.readAsText(slice);
    });
  };

  const parseCSVPhones = (file: File, headers: string[]): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string || '';
          const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length <= 1) {
            resolve([]);
            return;
          }
          
          const header_lower = headers.map(h => h.toLowerCase().trim());
          const phone_names = ["phone", "mobile", "number", "telephone", "phone number", "msisdn", "recipient"];
          let phoneIdx = -1;
          for (const p_name of phone_names) {
            const idx = header_lower.indexOf(p_name);
            if (idx !== -1) {
              phoneIdx = idx;
              break;
            }
          }
          if (phoneIdx === -1) {
            for (let i = 0; i < header_lower.length; i++) {
              if (header_lower[i].includes('phone') || header_lower[i].includes('num') || header_lower[i].includes('cell')) {
                phoneIdx = i;
                break;
              }
            }
          }
          if (phoneIdx === -1) phoneIdx = 0;

          const phones: string[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
            if (cols.length > phoneIdx) {
              const val = cols[phoneIdx];
              if (val) {
                phones.push(val);
              }
            }
          }
          resolve(phones);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const convertExcelToCSVText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          resolve(csvText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleComposerCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setCsvUploadLoading(true);
    setResult(null);

    try {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      let originalName = file.name;
      if (isExcel) {
        const csvText = await convertExcelToCSVText(file);
        file = new File([csvText], file.name.replace(/\.(xlsx|xls)$/i, '.csv'), { type: 'text/csv' });
      }

      const { headers, preview } = await parseCSVPreview(file);
      setCsvHeaders(headers);
      setCsvPreviewRow(preview);

      const lines = await countCSVLines(file);
      setEstimatedContactsCount(lines);
      setDirectCsvFile(file);

      const groupName = `Composer Upload: ${originalName}`;
      setDirectCsvGroupName(groupName);

      const phones = await parseCSVPhones(file, headers);
      if (phones.length > 5000) {
        setRecipients(phones.slice(0, 5000).join('\n') + `\n\n[... and ${phones.length - 5000} more contacts loaded from ${originalName}]`);
      } else {
        setRecipients(phones.join('\n'));
      }
      setIsLocalUploadActive(true);
      setResult({ type: 'success', text: `Spreadsheet '${originalName}' mapped successfully. Ready to compose campaign!` });
    } catch (err: any) {
      setResult({ type: 'error', text: `Failed to map spreadsheet: ${err.message}` });
    } finally {
      setCsvUploadLoading(false);
    }
  };

  // Advanced features
  const [batchNumber, setBatchNumber] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [includeOptOut, setIncludeOptOut] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [localScheduledAt, setLocalScheduledAt] = useState('');

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
    async function loadSenderIds() {
      try {
        const resp = await api.get('/sender-ids/approved');
        setSenderIds(resp.data);
        if (resp.data && resp.data.length > 0) {
          setSenderId(resp.data[0]);
        }
      } catch { /* noop */ }
    }
    fetchGroups();
    loadSenderIds();
    fetchTemplates();
  }, [fetchGroups, fetchTemplates]);

  useEffect(() => {
    const toParam = searchParams.get('to') || searchParams.get('phone');
    if (toParam) {
      if (toParam.includes(',')) {
        setRecipients(toParam.split(',').join('\n'));
        setSendMode('bulk');
      } else {
        setRecipients(toParam);
        setSendMode('single');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const templateId = searchParams.get('template_id');
    if (templateId && templates.length > 0) {
      const match = templates.find(t => t.id === templateId);
      if (match) {
        setSelectedTemplateId(templateId);
        setMessage(match.content);
      }
    }
  }, [searchParams, templates]);

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
      setLoadedContacts([]);
      return;
    }
    if (isLocalUploadActive) {
      return;
    }
    if (selectedGroupIds.length === 0) {
      setRecipients('');
      setLoadedContacts([]);
      return;
    }

    async function loadGroupContacts() {
      setLoadingGroup(true);
      try {
        let allContacts: any[] = [];
        
        if (selectedGroupIds.includes('all-contacts')) {
          const resp = await api.get('/contacts', { params: { limit: 10000 } });
          allContacts = resp.data;
        } else {
          // Fetch contacts for all selected groups in parallel
          const requests = selectedGroupIds.map(groupId => 
            api.get('/contacts', { params: { group_id: groupId, limit: 10000 } })
          );
          const responses = await Promise.all(requests);
          for (const resp of responses) {
            allContacts = [...allContacts, ...resp.data];
          }
        }
        
        // Remove duplicates by phone number automatically
        const seen = new Set();
        const uniqueContacts = allContacts.filter(c => {
          if (seen.has(c.phone)) return false;
          seen.add(c.phone);
          return true;
        });

        setLoadedContacts(uniqueContacts);
        setRecipients(uniqueContacts.map((c: any) => c.phone).join('\n'));
      } catch {
        setResult({ type: 'error', text: 'Failed to load contacts for the selected groups.' });
      } finally {
        setLoadingGroup(false);
      }
    }

    loadGroupContacts();
  }, [selectedGroupIds, sendMode, directCsvFile, isLocalUploadActive]);

  // Reset recipients if switching modes
  const handleModeChange = (mode: 'single' | 'bulk' | 'group') => {
    setSendMode(mode);
    setRecipients('');
    setSelectedGroupIds([]);
    setLoadedContacts([]);
    setDirectCsvFile(null);
    setEstimatedContactsCount(null);
    setCsvHeaders([]);
    setCsvPreviewRow(null);
    setIsLocalUploadActive(false);
  };

  const toggleGroupSelection = (groupId: string) => {
    setIsLocalUploadActive(false);
    if (groupId === 'all-contacts') {
      if (selectedGroupIds.includes('all-contacts')) {
        setSelectedGroupIds([]);
      } else {
        setSelectedGroupIds(['all-contacts']);
      }
    } else {
      let newIds = selectedGroupIds.filter(id => id !== 'all-contacts');
      if (newIds.includes(groupId)) {
        newIds = newIds.filter(id => id !== groupId);
      } else {
        newIds = [...newIds, groupId];
      }
      setSelectedGroupIds(newIds);
    }
  };

  const insertPlaceholder = (ph: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = before + ph + after;
    setMessage(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + ph.length, start + ph.length);
    }, 0);
  };

  const dynamicPlaceholders = useMemo(() => {
    const base = ['{{name}}', '{{phone}}', '{{email}}'];
    const customKeys = new Set<string>();
    
    loadedContacts.forEach((contact: any) => {
      if (contact.custom_attributes && typeof contact.custom_attributes === 'object') {
        Object.keys(contact.custom_attributes).forEach(key => {
          customKeys.add(key);
        });
      }
    });

    csvHeaders.forEach(key => {
      if (key !== 'name' && key !== 'phone' && key !== 'email') {
        customKeys.add(key);
      }
    });
    
    return [...base, ...Array.from(customKeys).map(key => `{{${key}}}`)];
  }, [loadedContacts, csvHeaders]);

  const getPersonalizedPreview = () => {
    let contactData: Record<string, string> = {};
    let customAttrs: Record<string, string> = {};

    if (loadedContacts.length > 0) {
      const contact = loadedContacts[0];
      contactData = {
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
      };
      customAttrs = (contact.custom_attributes as Record<string, string>) || {};
    } else if (csvPreviewRow) {
      contactData = {
        name: csvPreviewRow.name || csvPreviewRow.first_name || '',
        phone: csvPreviewRow.phone || csvPreviewRow.mobile || '',
        email: csvPreviewRow.email || '',
      };
      customAttrs = csvPreviewRow;
    } else {
      return message;
    }

    let msg = message;
    msg = msg.replace(/\{\{name\}\}/g, contactData.name);
    msg = msg.replace(/\{\{phone\}\}/g, contactData.phone);
    msg = msg.replace(/\{\{email\}\}/g, contactData.email);
    
    Object.entries(customAttrs).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}(?:\\s*\\|\\s*(?:default|fallback)\\s*=\\s*["'](.*?)["'])?`, 'g');
      msg = msg.replace(regex, (match, fallback) => {
        return value || fallback || '';
      });
    });
    
    msg = msg.replace(/\{\{name\s*\|\s*(?:default|fallback)\s*=\s*["'](.*?)["']\}\}/g, (match, fallback) => contactData.name || fallback);
    msg = msg.replace(/\{\{phone\s*\|\s*(?:default|fallback)\s*=\s*["'](.*?)["']\}\}/g, (match, fallback) => contactData.phone || fallback);
    msg = msg.replace(/\{\{email\s*\|\s*(?:default|fallback)\s*=\s*["'](.*?)["']\}\}/g, (match, fallback) => contactData.email || fallback);
    
    msg = msg.replace(/\{\{(.*?)\}\}/g, (match, token) => {
      if (token.includes('|')) {
        const parts = token.split('|');
        const fbMatch = parts[1].match(/(?:default|fallback)\s*=\s*["'](.*?)["']/);
        return fbMatch ? fbMatch[1] : '';
      }
      return '';
    });
    
    return msg;
  };

  const hasPlaceholders = /\{\{(.*?)\}\}/.test(message);


  const fullMessageText = message ? (message + '\nSTOP *456*9*5#') : '';
  const { parts: smsCount, charCount, isUnicode } = calculateSmsParts(fullMessageText);
  const recipientCount = (sendMode === 'group' && directCsvFile)
    ? (estimatedContactsCount || 0)
    : (sendMode === 'group')
      ? loadedContacts.length
      : recipients.split(/[\n,;]+/).filter((r) => r.trim()).length;
  const estimatedCost = recipientCount * smsCount;

  const handleSend = async (e?: React.FormEvent, isScheduledParam?: boolean, scheduledAtParam?: string) => {
    if (e) e.preventDefault();
    setResult(null);
    setIsSending(true);

    const isSched = isScheduledParam !== undefined ? isScheduledParam : isScheduled;
    const schedAt = scheduledAtParam !== undefined ? scheduledAtParam : scheduledAt;

    if (!message.trim()) {
      setResult({ type: 'error', text: 'Message content cannot be empty.' });
      setIsSending(false);
      return;
    }

    if (sendMode !== 'group') {
      const phones = recipients.split(/[\n,;]+/).map((r) => r.trim()).filter(Boolean);
      if (phones.length === 0) {
        setResult({ type: 'error', text: 'Please enter at least one recipient.' });
        setIsSending(false);
        return;
      }

      if (!user?.is_postpay && (user?.sms_balance || 0) < estimatedCost) {
        setResult({ type: 'error', text: `Insufficient balance. Need ${estimatedCost.toFixed(2)} credits, you have ${user?.sms_balance?.toLocaleString()}.` });
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
        await Promise.all([
          api.post('/messages/send', {
            recipients: phones,
            message: message,
            sender_id: senderId,
            batch_number: batchNumber || undefined,
            scheduled_at: isSched && schedAt ? new Date(schedAt).toISOString() : undefined,
            include_opt_out: includeOptOut,
          }),
          new Promise(resolve => setTimeout(resolve, 2200))
        ]);

        clearInterval(progressInterval);
        setRadarProgress(100);
        setRadarStatus('Completed successfully!');

        setTimeout(() => {
          setShowRadar(false);
          setResult({ type: 'success', text: isSched ? `${phones.length} message(s) scheduled successfully!` : `${phones.length} message(s) queued for delivery successfully!` });
          setRecipients('');
          setMessage('');
          setBatchNumber('');
          setIsScheduled(false);
          setScheduledAt('');
          setLocalScheduledAt('');
        }, 700);
        await refreshUser();
      } catch (err: any) {
        clearInterval(progressInterval);
        setShowRadar(false);
        setResult({ type: 'error', text: formatErrorDetail(err.response?.data?.detail) || 'Failed to dispatch messages.' });
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Otherwise: sendMode === 'group'
    if (recipientCount === 0) {
      setResult({ type: 'error', text: 'No contacts selected to broadcast to.' });
      setIsSending(false);
      return;
    }

    if (!user?.is_postpay && (user?.sms_balance || 0) < estimatedCost) {
      setResult({ type: 'error', text: `Insufficient balance. Need ${estimatedCost.toFixed(2)} credits, you have ${user?.sms_balance?.toLocaleString()}.` });
      setIsSending(false);
      return;
    }

    setShowRadar(true);
    setRadarProgress(0);
    setRadarStatus('Initializing campaign broadcast...');
    setDispatchedCount(recipientCount);

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 3;
      if (progress >= 95) progress = 95;
      setRadarProgress(progress);
      
      if (progress < 30) {
        setRadarStatus('Creating contact segment...');
      } else if (progress < 65) {
        setRadarStatus('Uploading CSV database records...');
      } else {
        setRadarStatus('Queuing backend campaign workers...');
      }
    }, 100);

    try {
      let finalGroupId: string | null = null;

      if (directCsvFile) {
        // 1. Create the Group
        const groupResp = await api.post('/contacts/groups', {
          name: directCsvGroupName,
          description: `Uploaded from composer on ${new Date().toLocaleDateString()}`
        });
        finalGroupId = groupResp.data.id;

        // 2. Upload the CSV File
        const formData = new FormData();
        formData.append('file', directCsvFile);
        if (finalGroupId) {
          formData.append('group_id', finalGroupId);
        }
        const importId = `import-${Date.now()}`;
        await api.post(`/contacts/import?import_id=${importId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Wait for the import background task to complete using EventSource
        await new Promise<void>((resolvePromise, rejectPromise) => {
          const baseURL = api.defaults.baseURL || 'http://localhost:8000/api/v1';
          const eventSource = new EventSource(`${baseURL}/contacts/import/stream?import_id=${importId}`);
          
          eventSource.onmessage = (event) => {
            const msg = event.data;
            if (msg.includes('COMPLETE')) {
              eventSource.close();
              resolvePromise();
            } else if (msg.includes('FATAL') || msg.includes('❌')) {
              eventSource.close();
              rejectPromise(new Error('CSV Import failed during background processing.'));
            }
          };

          eventSource.onerror = (err) => {
            console.error('SSE Error during composer import:', err);
            eventSource.close();
            rejectPromise(new Error('Connection to import stream lost.'));
          };
        });
      } else {
        // Select targeted group(s)
        if (selectedGroupIds.includes('all-contacts')) {
          finalGroupId = null;
        } else if (selectedGroupIds.length > 0) {
          finalGroupId = selectedGroupIds[0];
        }
      }

      // 3. Dispatch Campaigns
      const targetGroupIds = finalGroupId === null && !directCsvFile 
        ? [null] 
        : finalGroupId 
          ? [finalGroupId] 
          : [];

      await Promise.all(targetGroupIds.map(async (gid) => {
        const campaignName = directCsvFile 
          ? `Broadcast: ${directCsvFile.name.replace(/\.[^/.]+$/, "")}`
          : gid === null 
            ? `Broadcast: All Contacts - ${new Date().toLocaleDateString()}`
            : `Broadcast: Group - ${new Date().toLocaleDateString()}`;

        await api.post('/campaigns', {
          name: campaignName,
          message_content: message,
          sender_id: senderId,
          group_id: gid || undefined,
          batch_number: batchNumber || undefined,
          scheduled_at: isSched && schedAt ? new Date(schedAt).toISOString() : undefined,
          include_opt_out: includeOptOut,
        });
      }));

      clearInterval(progressInterval);
      setRadarProgress(100);
      setRadarStatus('Campaign broadcast scheduled successfully!');

      setTimeout(() => {
        setShowRadar(false);
        setResult({
          type: 'success',
          text: isSched 
            ? `Campaign broadcast scheduled successfully!` 
            : `Campaign broadcast initiated and queued successfully!`
        });
        setMessage('');
        setDirectCsvFile(null);
        setEstimatedContactsCount(null);
        setCsvHeaders([]);
        setCsvPreviewRow(null);
        setIsLocalUploadActive(false);
        setSelectedGroupIds([]);
        setBatchNumber('');
        setIsScheduled(false);
        setScheduledAt('');
        setLocalScheduledAt('');
        fetchGroups();
      }, 700);
      await refreshUser();
    } catch (err: any) {
      clearInterval(progressInterval);
      setShowRadar(false);
      const errMsg = formatErrorDetail(err.response?.data?.detail) || err.message;
      setResult({
        type: 'error',
        text: `Failed to launch campaign: ${errMsg}`
      });

      // Show alert modal with action buttons
      if (err.response?.status === 402 || errMsg.toLowerCase().includes('balance') || errMsg.toLowerCase().includes('credit') || errMsg.toLowerCase().includes('insufficient')) {
        setErrorModal({
          title: "Insufficient Wallet Balance ⚠️",
          message: "You do not have enough SMS credits in your wallet to launch this campaign. Please top up your balance to proceed.",
          actionText: "Top Up Wallet",
          actionPath: "/dashboard/wallet"
        });
      } else {
        setErrorModal({
          title: "Campaign Dispatch Failed ❌",
          message: errMsg
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6 pb-36 lg:pb-0">
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

      {/* Error Alert Modal */}
      <AnimatePresence>
        {errorModal && (
          <GenieModal 
            onClose={() => setErrorModal(null)} 
            className="p-6 space-y-5 text-left max-w-sm"
          >
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                {errorModal.title}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              {errorModal.message}
            </p>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setErrorModal(null)} 
                className="clay-button-secondary flex-1 py-2.5 rounded-xl text-xs font-medium text-slate-600 cursor-pointer transition-all"
              >
                Close
              </button>
              {errorModal.actionText && errorModal.actionPath && (
                <button
                  type="button"
                  onClick={() => {
                    if (errorModal.actionPath) {
                      setErrorModal(null);
                      navigate(errorModal.actionPath);
                    }
                  }}
                  className="clay-button-primary flex-1 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all bg-brand-primary"
                >
                  {errorModal.actionText}
                </button>
              )}
            </div>
          </GenieModal>
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
            <select
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all cursor-pointer"
            >
              {senderIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
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
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Select Target Groups</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => toggleGroupSelection('all-contacts')}
                    className={`clay-pill px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                      selectedGroupIds.includes('all-contacts')
                        ? 'clay-pill-active-glow scale-[1.02]'
                        : 'text-slate-600 dark:text-gray-400 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    All Contacts
                  </button>

                  {groups.map((g) => {
                    const isSelected = selectedGroupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroupSelection(g.id)}
                        className={`clay-pill px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'clay-pill-active-glow scale-[1.02]'
                            : 'text-slate-600 dark:text-gray-400 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-transparent'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {g.name}
                      </button>
                    );
                  })}
                </div>
                {selectedGroupIds.length === 0 && (
                  <p className="text-[10px] text-slate-400">Please select one or more groups to send message to.</p>
                )}
                
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-400 dark:text-gray-500">Need to upload a new list?</span>
                  <label className="clay-button-secondary text-[10px] px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-all flex items-center gap-1">
                    {csvUploadLoading ? (
                      <Loader size="sm" />
                    ) : (
                      <>📁 Upload CSV/Excel List</>
                    )}
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      disabled={csvUploadLoading}
                      onChange={handleComposerCSVUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {sendMode === 'group' && directCsvFile && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl flex items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-primary font-mono truncate max-w-[200px]">
                    📄 {directCsvFile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10">
                    {estimatedContactsCount} contacts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDirectCsvFile(null);
                    setEstimatedContactsCount(null);
                    setCsvHeaders([]);
                    setCsvPreviewRow(null);
                    setIsLocalUploadActive(false);
                    setRecipients('');
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            )}

            <div className="space-y-1.5 relative">
              <label className="block text-xs font-medium text-slate-600 dark:text-gray-400">Recipient Phone Numbers</label>
              <textarea
                rows={4}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                readOnly={sendMode === 'group'}
                className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono custom-scrollbar resize-none disabled:opacity-75"
                placeholder={
                  sendMode === 'single'
                    ? '+254712345678'
                    : sendMode === 'bulk'
                    ? '+254712345678\n+254723456789'
                    : 'Select one or more groups to populate phone numbers...'
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
                  ? 'Numbers loaded from the selected contact segments.'
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5 text-left">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-emerald" /> Compose Message
                </h3>
                {includeOptOut && (
                  <span className="text-amber-500 font-medium text-[10px] block">
                    [15 characters are automatically added for opt out]
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 max-w-full">
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
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSelectedTemplateId('');
              }}
              rows={5}
              className="clay-input w-full px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm transition-all resize-none animate-none"
              placeholder="Type your message here..."
            />

            {sendMode === 'group' && (loadedContacts.length > 0 || csvPreviewRow) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500 uppercase mr-1">Insert Placeholder:</span>
                {dynamicPlaceholders.map((placeholder) => (
                  <button
                    key={placeholder}
                    type="button"
                    onClick={() => insertPlaceholder(placeholder)}
                    className="clay-pill px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-brand-primary hover:bg-brand-primary/10 transition-all cursor-pointer"
                  >
                    {placeholder}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-gray-500 font-mono">
              <div className="flex items-center gap-2">
                <span>
                  {charCount} / {isUnicode ? 70 : 160} characters{' '}
                  {isUnicode && (
                    <span className="text-amber-500 font-semibold">(Unicode encoding)</span>
                  )}
                </span>
                <span>•</span>
                <span>{smsCount} SMS part(s)</span>
              </div>
              
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-gray-300 select-none">
                <input 
                  type="checkbox"
                  checked={includeOptOut}
                  onChange={(e) => setIncludeOptOut(e.target.checked)}
                  className="rounded border-slate-300 dark:border-white/10 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                />
                <span>Auto-append opt-out footer (<span className="font-mono text-[10px]">*456*9*5#</span>)</span>
              </label>
            </div>

            {sendMode === 'group' && (loadedContacts.length > 0 || csvPreviewRow) && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">
                  <span>📱 Live Personalization Preview</span>
                  <span className="text-brand-primary">
                    Recipient 1: {loadedContacts[0]?.name || csvPreviewRow?.name || csvPreviewRow?.first_name || 'Unnamed'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs text-slate-700 dark:text-gray-300 font-sans leading-relaxed break-words whitespace-pre-wrap">
                  {getPersonalizedPreview() || <span className="text-slate-400 italic">Preview will appear here as you type...</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Summary & Send */}
        <div className="space-y-5">
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
            </div>
          </div>

          <div className="clay-card rounded-3xl p-5 space-y-4 sticky top-20">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Summary</h3>

            <div className="space-y-3">
              {[
                { label: 'Sender ID', value: senderId || 'None Selected' },
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
                {user?.is_postpay ? (
                  <>
                    <span className="text-slate-500 dark:text-gray-400">Billing Model</span>
                    <span className="font-bold text-brand-primary font-mono">Postpaid</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 dark:text-gray-400">Your Balance</span>
                    <span className="font-bold text-brand-primary font-mono">{user?.sms_balance?.toLocaleString() || '0'}</span>
                  </>
                )}
              </div>

              {!user?.is_postpay && estimatedCost > (user?.sms_balance || 0) && estimatedCost > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Insufficient balance</span>
                </div>
              )}
            </div>
            
             <div className="flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={isSending || charCount === 0 || recipientCount === 0 || (!user?.is_postpay && estimatedCost > (user?.sms_balance || 0))}
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
 
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                disabled={isSending || charCount === 0 || recipientCount === 0 || (!user?.is_postpay && estimatedCost > (user?.sms_balance || 0))}
                className="clay-button-secondary w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold text-slate-600 dark:text-gray-300 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Send Later</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Delivery typically under 3 seconds</span>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Send Bar */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/90 dark:bg-surface-dark/95 backdrop-blur-md border-t border-slate-200/50 dark:border-white/10 z-40 lg:hidden flex items-center justify-between gap-4 shadow-lg">
          <div className="text-left">
            <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Estimated Cost</div>
            <div className="text-sm font-bold text-brand-primary font-mono">
              {estimatedCost.toLocaleString()} credits
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              disabled={isSending || charCount === 0 || recipientCount === 0 || (!user?.is_postpay && estimatedCost > (user?.sms_balance || 0))}
              className="clay-button-secondary p-3 rounded-2xl text-slate-600 dark:text-gray-300 transition-all disabled:opacity-50"
              title="Schedule send"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={isSending || charCount === 0 || recipientCount === 0 || (!user?.is_postpay && estimatedCost > (user?.sms_balance || 0))}
              className="clay-button-primary px-5 py-3 rounded-2xl text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSending ? (
                <Loader size="sm" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Schedule Send Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <GenieModal onClose={() => setShowScheduleModal(false)} className="p-6 space-y-5 overflow-visible">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-primary" /> Schedule Dispatch
              </h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Choose the date and time you would like this broadcast campaign or message to be sent to your recipients.
              </p>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Scheduled Date & Time *
                </label>
                <DateTimePicker
                  value={localScheduledAt}
                  onChange={setLocalScheduledAt}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="clay-button-secondary flex-1 py-3 rounded-2xl text-sm font-medium text-slate-600 cursor-pointer transition-all">Cancel</button>
              <button 
                type="button" 
                onClick={() => {
                  if (!localScheduledAt) {
                    alert('Please select a date and time.');
                    return;
                  }
                  setShowScheduleModal(false);
                  handleSend(undefined, true, localScheduledAt);
                }} 
                className="clay-button-primary flex-1 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all"
              >
                Confirm Schedule
              </button>
            </div>
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Dispatch Radar Modal */}
      <AnimatePresence>
        {showRadar && (
          <GenieModal onClose={() => setShowRadar(false)} className="bg-slate-950 border border-indigo-500/25 rounded-2xl max-w-sm overflow-hidden p-6 text-center space-y-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">📡 Telecom Dispatcher</span>
              <span className="text-[10px] font-bold text-slate-500">{radarProgress}%</span>
            </div>

            {/* Default Loader */}
            <div className="py-6 flex items-center justify-center">
              <Loader size="md" />
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
          </GenieModal>
        )}
      </AnimatePresence>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveTemplateModal && (
          <GenieModal onClose={() => setShowSaveTemplateModal(false)} className="max-w-sm p-6">
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
          </GenieModal>
        )}
      </AnimatePresence>
    </div>
  );
}
