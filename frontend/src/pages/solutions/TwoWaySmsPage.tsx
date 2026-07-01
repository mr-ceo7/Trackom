import React, { useState } from 'react';
import Header from '../../components/Header';
import TrackomLogo from '../../components/TrackomLogo';
import SignupModal from '../../components/SignupModal';
import ParticleCanvas from '../../components/ParticleCanvas';
import { MessageSquare, ArrowRight, CornerDownLeft, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function TwoWaySmsPage() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chats, setChats] = useState([
    { sender: 'user', text: 'JOIN PROMO' },
    { sender: 'system', text: 'Thank you! You have joined the Flash Sale promo. Text OFF to stop.' }
  ]);

  const handleSimulateReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newChats = [...chats, { sender: 'user', text: inputText }];
    setChats(newChats);
    setInputText('');

    // Simulate system response after 800ms
    setTimeout(() => {
      let reply = "Sorry, keyword not recognized. Text HELP for options.";
      if (inputText.toUpperCase().includes('HELP')) {
        reply = "Available keywords: INFO (details), BAL (credits check), OFF (opt-out).";
      } else if (inputText.toUpperCase().includes('INFO')) {
        reply = "Trackom B2B Platform enables two-way interactive message triggers.";
      } else if (inputText.toUpperCase().includes('OFF')) {
        reply = "Unsubscribed! You will no longer receive marketing messages.";
      }
      setChats(prev => [...prev, { sender: 'system', text: reply }]);
    }, 800);
  };

  return (
    <div className="min-h-screen text-slate-800 bg-[#F3F4FD] dark:text-gray-200 dark:bg-surface-dark selection:bg-brand-primary/30 transition-colors duration-300 relative flex flex-col justify-between font-sans">
      <ParticleCanvas />
      <Header onOpenSignup={() => setIsSignupOpen(true)} />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-5 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary font-mono">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Interactive Chat messaging</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            Enable Conversational Flows with <span className="gradient-text">Two-Way SMS</span>
          </h1>
          <p className="text-base text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
            Collect feedback, launch SMS surveys, and build automated text responders using dedicated shortcodes or standard mobile numbers.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => setIsSignupOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Request Shortcode Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Live Simulation Console */}
        <section className="glass-card rounded-2xl p-8 border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-left">
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Conversational SMS Sandbox</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Test how replies process on Trackom. Type a keyword (like <strong>HELP</strong>, <strong>INFO</strong>, or <strong>OFF</strong>) in the console simulation to trigger automated response webhooks.
            </p>
            
            <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/5 text-[11px] text-slate-500 flex gap-2">
              <CornerDownLeft className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Incoming replies trigger instant HTTP POST callbacks to your system's webhook URLs.</span>
            </div>
          </div>

          {/* Interactive Chat Console */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070913] shadow-lg flex flex-col h-72 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>💬 REPLY SIMULATOR (SHORTCODE: 22442)</span>
              <span className="text-brand-emerald animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 bg-brand-emerald rounded-full" /> BINDED</span>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-3 scroll-smooth text-xs flex flex-col">
              {chats.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[80%] rounded-xl p-3 leading-relaxed ${
                    chat.sender === 'user'
                      ? 'bg-brand-primary text-white self-end text-right'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-gray-200 self-start text-left'
                  }`}
                >
                  {chat.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSimulateReply} className="p-3 border-t border-slate-200 dark:border-white/10 flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type 'HELP' or other message..."
                className="flex-grow px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary"
              />
              <button 
                type="submit" 
                className="p-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white cursor-pointer transition-all shadow-md shadow-brand-primary/20 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>

        {/* Core Specs Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Keyword Parsing', desc: 'Auto-route replies based on initial text prefixes. Seamlessly triggers automated campaign subscriptions or custom user flows.', icon: MessageSquare, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { title: 'Sub-Second Webhooks', desc: 'Incoming text payloads post to your server in <150ms, allowing rapid-fire conversational responses.', icon: Send, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { title: 'Dedicated Shortcodes', desc: 'Secure custom 5-digit shortcodes (e.g. 22442) directly from CA Kenya to build brand recognition.', icon: MessageSquare, color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/10 space-y-4">
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/6 py-12 px-4 md:px-8 text-center relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TrackomLogo size={20} />
          <span className="text-[10px] text-slate-500 font-medium font-mono">
            © 2026 Trackom Group. All rights reserved.
          </span>
        </div>
      </footer>

      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
}
