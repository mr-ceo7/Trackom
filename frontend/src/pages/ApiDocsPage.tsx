/**
 * ApiDocsPage - Stripe-style interactive API reference.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Code2, Copy, CheckCircle2, Terminal, Cpu, Lock, Globe } from 'lucide-react';
import Header from '../components/Header';
import TrackomLogo from '../components/TrackomLogo';

const endpoints = [
  { method: 'POST', path: '/api/messages/send', desc: 'Send bulk SMS messages. Automatically detects Unicode and deducts credits accordingly.', auth: true, body: '{ "recipients": ["+254712345678", "+254723456789"], "message": "Hello from Trackom!", "sender_id": "TRACKOM" }', response: '{ "queued": 2, "total_cost": 2, "message_id": "batch_uuid_...", "status": "queued" }' },
  { method: 'POST', path: '/api/contacts/import', desc: 'Asynchronously import contacts via CSV upload. Sanitizes phone numbers and filters duplicates.', auth: true, body: 'multipart/form-data:\n- file: contacts.csv\n- group_id: group_uuid (optional)', response: '{ "status": "queued", "message": "CSV import initiated successfully." }' },
  { method: 'POST', path: '/api/auth/register', desc: 'Create a new user account', auth: false, body: '{ "full_name": "John Doe", "email": "john@example.com", "password": "SecurePass1!", "account_type": "business" }', response: '{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer" }' },
  { method: 'POST', path: '/api/auth/login', desc: 'Authenticate with email & password', auth: false, body: '{ "email": "john@example.com", "password": "SecurePass1!" }', response: '{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer" }' },
  { method: 'GET', path: '/api/users/me', desc: 'Get current user profile', auth: true, body: null, response: '{ "id": "uuid", "email": "john@example.com", "full_name": "John Doe", "sms_balance": 10000, "plan": "starter" }' },
  { method: 'GET', path: '/api/health', desc: 'Health check', auth: false, body: null, response: '{ "status": "healthy", "app": "Trackom API", "version": "1.0.0" }' },
];

const sdkExamples: Record<string, string> = {
  curl: `curl -X POST https://api.trackom.co.ke/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@company.co.ke","password":"your-password"}'`,
  python: `import httpx

resp = httpx.post("https://api.trackom.co.ke/api/auth/login", json={
    "email": "you@company.co.ke",
    "password": "your-password"
})
token = resp.json()["access_token"]`,
  javascript: `const resp = await fetch("https://api.trackom.co.ke/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "you@company.co.ke",
    password: "your-password"
  })
});
const { access_token } = await resp.json();`,
};

const methodColors: Record<string, string> = {
  GET: 'bg-brand-emerald/10 text-brand-emerald',
  POST: 'bg-blue-500/10 text-blue-500',
  PUT: 'bg-amber-500/10 text-amber-500',
  DELETE: 'bg-red-500/10 text-red-500',
};

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [activeSDK, setActiveSDK] = useState('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ep = endpoints[activeEndpoint];

  return (
    <div className="min-h-screen bg-[#F3F4FD] dark:bg-surface-dark">
      <Header />

      <section className="pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary font-mono mb-4">
            <Terminal className="w-3 h-3" /> API REFERENCE
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">API Documentation</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">Integrate Trackom's messaging platform into your application. RESTful API with JSON responses.</p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Base URL: <code className="font-mono text-brand-primary">https://api.trackom.co.ke</code></span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />Auth: Bearer JWT</span>
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" />JSON / REST</span>
          </div>
        </motion.div>

        {/* SDK Examples */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-brand-primary" />Quick Start</h3>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
              {Object.keys(sdkExamples).map(lang => (
                <button key={lang} onClick={() => setActiveSDK(lang)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer transition-all ${activeSDK === lang ? 'bg-white dark:bg-white/10 text-brand-primary shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}>{lang}</button>
              ))}
            </div>
          </div>
          <div className="relative">
            <pre className="bg-slate-900 rounded-xl p-5 text-sm text-slate-300 overflow-x-auto font-mono leading-relaxed"><code>{sdkExamples[activeSDK]}</code></pre>
            <button onClick={() => handleCopy(sdkExamples[activeSDK])} className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer transition-all">
              {copied ? <CheckCircle2 className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Endpoint browser */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoint list */}
          <div className="space-y-2">
            <h3 className="font-display font-semibold text-xs uppercase text-slate-500 dark:text-gray-400 tracking-wider px-2 mb-3">Endpoints</h3>
            {endpoints.map((ep, i) => (
              <button key={i} onClick={() => setActiveEndpoint(i)} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${activeEndpoint === i ? 'bg-brand-primary/10 border border-brand-primary/20' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${methodColors[ep.method]}`}>{ep.method}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-mono truncate ${activeEndpoint === i ? 'text-brand-primary' : 'text-slate-600 dark:text-gray-400'}`}>{ep.path}</div>
                </div>
                {ep.auth && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Endpoint detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${methodColors[ep.method]}`}>{ep.method}</span>
                <code className="text-sm font-mono text-slate-900 dark:text-white">{ep.path}</code>
                {ep.auth && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-500 flex items-center gap-1"><Lock className="w-2.5 h-2.5" />Auth</span>}
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-400">{ep.desc}</p>

              {ep.body && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider mb-2">Request Body</h4>
                  <pre className="bg-slate-900 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto font-mono"><code>{ep.body}</code></pre>
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-semibold uppercase text-slate-500 dark:text-gray-400 tracking-wider mb-2">Response</h4>
                <pre className="bg-slate-900 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto font-mono"><code>{ep.response}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/6 py-8 px-4 text-center">
        <TrackomLogo size={20} />
        <p className="text-[10px] text-slate-400 dark:text-gray-600 mt-3 uppercase tracking-widest font-display">© 2026 Trackom Group. All rights reserved.</p>
      </footer>
    </div>
  );
}
