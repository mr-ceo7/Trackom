import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownRight, CreditCard, 
  Smartphone, Receipt, X, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../services/api';
import Loader from '../../components/Loader';

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  sms_credits: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  payment_method: string | null;
  status: string;
  created_at: string;
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // STK Simulator States
  const [isStkOpen, setIsStkOpen] = useState(false);
  const [stkPin, setStkPin] = useState('');
  const [stkStep, setStkStep] = useState<'prompt' | 'sending' | 'success' | 'error'>('prompt');
  const [stkError, setStkError] = useState('');

  const presets = [500, 1000, 2500, 5000, 10000];

  const fetchTransactions = useCallback(async () => {
    try {
      const resp = await api.get('/wallet/transactions');
      setTransactions(resp.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenStk = () => {
    if (!topupAmount || !phone) return;
    setErrorMsg('');
    setSuccessMsg('');
    setStkPin('');
    setStkStep('prompt');
    setStkError('');
    setIsStkOpen(true);
  };

  const handleKeyPress = (num: string) => {
    if (stkPin.length < 4) {
      setStkPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setStkPin(prev => prev.slice(0, -1));
  };

  const handleTriggerPayment = async () => {
    if (stkPin.length < 4) return;
    setStkStep('sending');

    try {
      // Dispatch API request
      const resp = await api.post('/wallet/topup', {
        amount: Number(topupAmount),
        phone_number: phone,
      });

      // Artificial delay to simulate M-Pesa processing state
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStkStep('success');
      setSuccessMsg(resp.data.response_description || 'Wallet credited successfully!');
      setTopupAmount('');
      setPhone('');
      await fetchTransactions();
      await refreshUser();
    } catch (err: any) {
      setStkStep('error');
      setStkError(err.response?.data?.detail || 'M-Pesa STK transaction failed.');
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Wallet</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-stat rounded-3xl p-6 col-span-1 sm:col-span-2 bg-gradient-to-br from-brand-primary to-brand-accent text-white relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="space-y-1">
              <div className="text-white/60 text-xs font-semibold uppercase tracking-wider">SMS Balance</div>
              <div className="text-4xl font-bold font-mono leading-none py-1">{user?.sms_balance?.toLocaleString() || '0'}</div>
              <div className="text-white/50 text-xs">credits remaining</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <button onClick={() => { setErrorMsg(''); setSuccessMsg(''); setShowTopup(!showTopup); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur cursor-pointer transition-all">
              <Plus className="w-4 h-4" />Top Up
            </button>
          </div>
        </div>
        <div className="clay-stat rounded-3xl p-6 flex flex-col justify-between">
          <div className="text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Plan</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{user?.plan || 'starter'}</div>
          <a href="/dashboard/settings" className="text-xs text-brand-primary font-semibold hover:underline mt-2">Upgrade →</a>
        </div>
      </div>

      {/* Top-up panel */}
      {showTopup && (
        <div className="clay-card rounded-3xl p-6 space-y-4">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-primary" />Quick Top-Up</h3>
          
          {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">{errorMsg}</div>}
          {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl">{successMsg}</div>}

          <div className="flex flex-wrap gap-2">
            {presets.map(a => (
              <button key={a} onClick={() => setTopupAmount(String(a))} className={`clay-pill px-4 py-2 rounded-2xl text-sm font-semibold cursor-pointer transition-all ${topupAmount === String(a) ? 'clay-nav-active text-brand-primary' : 'text-slate-600 dark:text-gray-400'}`}>
                KES {a.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="clay-input px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all" placeholder="Amount (KES)" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="clay-input px-4 py-3 rounded-2xl text-slate-900 dark:text-white focus:outline-none text-sm font-mono transition-all" placeholder="M-Pesa Number (e.g. 0712345678)" />
            <button onClick={handleOpenStk} disabled={!topupAmount || !phone} className="clay-button-primary flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white cursor-pointer transition-all">
              <Smartphone className="w-4 h-4" />
              <span>Simulate M-Pesa Pay</span>
            </button>
          </div>
          {topupAmount && Number(topupAmount) > 0 && (
            <p className="text-xs text-slate-500 dark:text-gray-400">You'll receive <span className="font-bold text-brand-primary">{(Number(topupAmount) * 10).toLocaleString()} SMS credits</span> (KES 0.10/SMS)</p>
          )}
        </div>
      )}

      {/* Transaction history */}
      <div className="clay-card rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/20 dark:border-white/6 flex items-center gap-2 clay-inset">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Transaction History</h3>
        </div>
        
        {loading ? (
          <div className="text-center py-12"><Loader size="md" /></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {transactions.map(tx => (
              <div key={tx.id} className="clay-row-hover px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl clay-icon-raised flex items-center justify-center shrink-0">
                    {tx.type === 'topup' ? <ArrowDownRight className="w-4 h-4 text-brand-emerald drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> : tx.type === 'bonus' ? <Wallet className="w-4 h-4 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" /> : <ArrowUpRight className="w-4 h-4 text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{tx.description || tx.type.replace('_', ' ')}</div>
                    <div className="text-[11px] text-slate-400 dark:text-gray-500 font-mono">{tx.reference || '—'} · {new Date(tx.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${tx.sms_credits > 0 ? 'text-brand-emerald' : 'text-red-400'}`}>{tx.sms_credits > 0 ? '+' : ''}{tx.sms_credits.toLocaleString()} credits</div>
                  {tx.amount !== 0 && <div className="text-[11px] text-slate-400 font-mono">KES {Math.abs(tx.amount).toLocaleString()}</div>}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-gray-400">No transactions recorded yet.</div>
            )}
          </div>
        )}
      </div>

      {/* STK Push Simulator Overlay Modal */}
      <AnimatePresence>
        {isStkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStkOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm rounded-[32px] border-4 border-slate-700 bg-[#0d0f19] text-white p-6 relative z-10 shadow-2xl overflow-hidden font-sans"
            >
              {/* Phone Speaker & Camera Notch */}
              <div className="w-32 h-4 rounded-full bg-slate-800 mx-auto mb-6 flex items-center justify-center border border-slate-700/50" />

              {stkStep === 'prompt' && (
                <div className="space-y-6 text-center">
                  <div className="bg-[#1C2035] rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="text-[10px] text-brand-emerald font-bold tracking-widest uppercase">M-PESA SIM TOOLKIT</div>
                    <div className="text-sm font-semibold text-gray-200">
                      Do you want to pay <span className="text-brand-emerald font-bold font-mono">KES {Number(topupAmount).toLocaleString()}</span> to <span className="font-bold text-white">TRACKOM B2B</span>?
                    </div>
                    
                    {/* Simulated PIN Boxes */}
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[10px] text-gray-400">Enter M-Pesa PIN</div>
                      <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((idx) => (
                          <div 
                            key={idx} 
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
                              stkPin.length > idx 
                                ? 'bg-brand-emerald border-brand-emerald text-slate-950' 
                                : 'border-white/20 bg-white/[0.02] text-white'
                            }`}
                          >
                            {stkPin.length > idx ? '•' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Digital Keypad */}
                  <div className="grid grid-cols-3 gap-2 px-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                      <button 
                        key={num} 
                        onClick={() => handleKeyPress(num)}
                        className="py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-lg font-bold font-mono cursor-pointer transition-all border border-white/5"
                      >
                        {num}
                      </button>
                    ))}
                    <button 
                      onClick={handleBackspace}
                      className="py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold cursor-pointer transition-all border border-red-500/10"
                    >
                      ⌫
                    </button>
                    <button 
                      onClick={() => handleKeyPress('0')}
                      className="py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-lg font-bold font-mono cursor-pointer transition-all border border-white/5"
                    >
                      0
                    </button>
                    <button 
                      onClick={handleTriggerPayment}
                      disabled={stkPin.length < 4}
                      className="py-3.5 rounded-2xl bg-brand-emerald hover:bg-brand-emerald/90 text-slate-950 font-bold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-brand-emerald/10"
                    >
                      Send
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsStkOpen(false)}
                    className="text-xs text-gray-500 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    Cancel Transaction
                  </button>
                </div>
              )}

              {stkStep === 'sending' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                  <div className="relative py-2">
                    <Loader size="md" color="var(--color-brand-emerald)" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-gray-200">Processing Payment...</h4>
                    <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed">
                      Verifying transaction pin and checking wallet balance. Do not close this window.
                    </p>
                  </div>
                </div>
              )}

              {stkStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full clay-icon-raised flex items-center justify-center text-brand-emerald animate-bounce">
                    <CheckCircle2 className="w-10 h-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-white">Payment Received!</h4>
                    <p className="text-xs text-gray-400 px-4 leading-relaxed">
                      Your transaction completed successfully. M-Pesa checkout reference updated.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsStkOpen(false)}
                    className="px-6 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emerald/90 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

              {stkStep === 'error' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full clay-icon-raised flex items-center justify-center text-red-500">
                    <ShieldAlert className="w-10 h-10 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-white">Transaction Failed</h4>
                    <p className="text-xs text-red-400 px-4 leading-relaxed font-mono">
                      {stkError}
                    </p>
                  </div>
                  <button 
                    onClick={() => setStkStep('prompt')}
                    className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
