import React, { useState, useEffect, useRef } from 'react';
import { Order, DigitalPaymentMethod, PaymentIntent, PaymentGatewayStatus } from '../../types';
import {
  paymentGatewayService,
  COMMISSARY_BANK_ACCOUNTS,
  COMMISSARY_DIGITAL_WALLETS,
  isMockPaymentMode,
  subscribeToPaymentUpdates,
} from '../../services/paymentGateway';
import {
  X,
  Smartphone,
  Building2,
  Banknote,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Upload,
  Zap,
  Info,
  Sparkles,
  Lock,
} from 'lucide-react';

interface BranchPaymentModalProps {
  order: Order;
  branchName: string;
  themeMode: 'light' | 'dark';
  onClose: () => void;
  onPaymentComplete: (proofUrl: string, paymentDetails: {
    paymentMethod: DigitalPaymentMethod | string;
    paymentIntentId?: string;
    referenceNumber?: string;
    status: PaymentGatewayStatus;
  }) => void;
}

const SAMPLE_PAYMENT_PROOFS = [
  {
    label: 'GCash Payment Confirmation Receipt',
    method: 'gcash',
    url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Maya Official Transaction Slip',
    method: 'maya',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'BDO InstaPay Transfer Receipt',
    method: 'bank_transfer',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
  },
];

export const BranchPaymentModal: React.FC<BranchPaymentModalProps> = ({
  order,
  branchName,
  themeMode,
  onClose,
  onPaymentComplete,
}) => {
  const isDark = themeMode === 'dark';
  const isMock = isMockPaymentMode();

  const [selectedMethod, setSelectedMethod] = useState<DigitalPaymentMethod>('gcash');
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);
  
  // Payment Intent State
  const [currentIntent, setCurrentIntent] = useState<PaymentIntent | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);
  
  // Manual / Bank Proof State
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [manualReference, setManualReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Timers & Status
  const [timeLeftSec, setTimeLeftSec] = useState(1800); // 30 minutes
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Generate / Fetch Payment Intent when method changes
  useEffect(() => {
    let isMounted = true;
    async function loadIntent() {
      setIsLoadingIntent(true);
      try {
        const intent = await paymentGatewayService.createPaymentIntent(
          order.id,
          order.totalAmount,
          selectedMethod,
          {
            branchName,
            description: `Wholesale Requisition #${order.id} for ${branchName}`,
          }
        );
        if (isMounted) {
          setCurrentIntent(intent);
          if (intent.referenceNumber) {
            setManualReference(intent.referenceNumber);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setToastMessage({
            type: 'error',
            text: err.message || 'Failed to initialize payment gateway intent.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingIntent(false);
        }
      }
    }

    loadIntent();
    return () => {
      isMounted = false;
    };
  }, [order.id, order.totalAmount, selectedMethod, branchName]);

  // Listen to Webhooks
  useEffect(() => {
    const unsubscribe = subscribeToPaymentUpdates((updatedIntent) => {
      if (currentIntent && updatedIntent.id === currentIntent.id) {
        setCurrentIntent(updatedIntent);
        if (updatedIntent.status === 'SUCCESSFUL') {
          setToastMessage({
            type: 'success',
            text: `Payment of ₱${order.totalAmount.toLocaleString()} verified via ${selectedMethod.toUpperCase()}!`,
          });
        } else if (updatedIntent.status === 'FAILED') {
          setToastMessage({
            type: 'error',
            text: 'Payment was declined or failed. Please retry.',
          });
        }
      }
    });
    return unsubscribe;
  }, [currentIntent, order.totalAmount, selectedMethod]);

  // Expiration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setToastMessage({
            type: 'error',
            text: 'Payment session expired. Please regenerate a new QR code.',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Simulate Instant Mobile Payment (Sandbox)
  const handleSimulatePaymentApproval = async () => {
    if (!currentIntent) return;
    setIsSimulatingApproval(true);
    try {
      const updated = await paymentGatewayService.simulatePaymentApproval(currentIntent.id);
      setCurrentIntent(updated);
      setToastMessage({
        type: 'success',
        text: `Sandbox Approval: E-Wallet confirmed! Trans Ref: ${updated.referenceNumber}`,
      });

      // Auto-populate proof URL with e-wallet confirmation
      const sampleProof =
        selectedMethod === 'gcash'
          ? SAMPLE_PAYMENT_PROOFS[0].url
          : selectedMethod === 'maya'
          ? SAMPLE_PAYMENT_PROOFS[1].url
          : SAMPLE_PAYMENT_PROOFS[2].url;

      // Finish and notify parent after a brief feedback delay
      setTimeout(() => {
        onPaymentComplete(sampleProof, {
          paymentMethod: selectedMethod,
          paymentIntentId: updated.id,
          referenceNumber: updated.referenceNumber,
          status: 'SUCCESSFUL',
        });
      }, 1000);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Payment simulation failed.',
      });
    } finally {
      setIsSimulatingApproval(false);
    }
  };

  // Check Status button
  const handleCheckStatus = async () => {
    if (!currentIntent) return;
    setIsVerifying(true);
    try {
      const res = await paymentGatewayService.checkPaymentStatus(currentIntent.id);
      if (res.status === 'SUCCESSFUL') {
        setToastMessage({
          type: 'success',
          text: 'Payment has been successfully verified by PayMongo/Maya gateway!',
        });
        const sampleProof = SAMPLE_PAYMENT_PROOFS[0].url;
        onPaymentComplete(sampleProof, {
          paymentMethod: selectedMethod,
          paymentIntentId: currentIntent.id,
          referenceNumber: currentIntent.referenceNumber,
          status: 'SUCCESSFUL',
        });
      } else if (res.status === 'FAILED') {
        setToastMessage({
          type: 'error',
          text: 'Payment was canceled or failed.',
        });
      } else if (res.status === 'EXPIRED') {
        setToastMessage({
          type: 'error',
          text: 'Payment QR code expired. Please generate a new one.',
        });
      } else {
        setToastMessage({
          type: 'info',
          text: 'Payment is still PENDING. Please complete the transfer on your mobile device.',
        });
      }
    } catch {
      setToastMessage({
        type: 'error',
        text: 'Error contacting payment status server.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit Bank Transfer or Manual Proof
  const handleManualProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrlInput.trim()) {
      setToastMessage({ type: 'error', text: 'Please provide a receipt screenshot image URL.' });
      return;
    }

    onPaymentComplete(proofUrlInput.trim(), {
      paymentMethod: selectedMethod,
      paymentIntentId: currentIntent?.id,
      referenceNumber: manualReference.trim() || currentIntent?.referenceNumber,
      status: selectedMethod === 'cash' ? 'PENDING' : 'PENDING',
    });
  };

  const activeBank = COMMISSARY_BANK_ACCOUNTS[selectedBankIndex] || COMMISSARY_BANK_ACCOUNTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] ${
          isDark ? 'bg-[#181818] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F37021]/10 text-[#F37021] flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Digital Checkout & Settlement
                </h3>
                {isMock && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    SANDBOX / MOCK ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Order #{order.id} • {order.packageName || 'Commissary Requisition'} • Total: <strong>₱{order.totalAmount.toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert banner */}
        {toastMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-medium flex items-center justify-between transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800'
                : toastMessage.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-b border-red-200 dark:border-red-800'
                : 'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border-b border-sky-200 dark:border-sky-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
              {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Method Selection Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Select Payment Option:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'gcash',
                  label: 'GCash QR',
                  sub: 'E-Wallet',
                  icon: Smartphone,
                  color: 'text-blue-500',
                  activeBorder: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 ring-2 ring-blue-500/20',
                },
                {
                  id: 'maya',
                  label: 'Maya QR',
                  sub: 'Digital Wallet',
                  icon: Smartphone,
                  color: 'text-emerald-500',
                  activeBorder: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20',
                },
                {
                  id: 'bank_transfer',
                  label: 'Bank Transfer',
                  sub: 'InstaPay / PESONet',
                  icon: Building2,
                  color: 'text-orange-500',
                  activeBorder: 'border-[#F37021] bg-orange-50/50 dark:bg-orange-950/40 text-[#F37021] ring-2 ring-[#F37021]/20',
                },
                {
                  id: 'cash',
                  label: 'Cash on Delivery',
                  sub: 'Franchise Terms',
                  icon: Banknote,
                  color: 'text-neutral-500',
                  activeBorder: 'border-neutral-500 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white ring-2 ring-neutral-500/20',
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as DigitalPaymentMethod)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? m.activeBorder + ' font-bold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${m.color}`} />
                      {isSelected && <span className="w-2 h-2 rounded-full bg-current"></span>}
                    </div>
                    <div>
                      <div className="text-xs">{m.label}</div>
                      <div className="text-[10px] opacity-75">{m.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              GCASH / MAYA QR CODE WORKFLOW
              ========================================================================= */}
          {(selectedMethod === 'gcash' || selectedMethod === 'maya') && (
            <div className="space-y-4">
              <div
                className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center gap-6 ${
                  selectedMethod === 'gcash'
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                }`}
              >
                {/* QR Code Container */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-200 relative group">
                    {isLoadingIntent ? (
                      <div className="w-48 h-48 flex flex-col items-center justify-center space-y-2 text-neutral-400">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="text-xs">Generating QR Ph...</span>
                      </div>
                    ) : currentIntent?.qrCodeUrl ? (
                      <>
                        <img
                          src={currentIntent.qrCodeUrl}
                          alt={`${selectedMethod.toUpperCase()} Payment QR Code`}
                          className="w-48 h-48 rounded-lg object-contain"
                        />
                        {/* Overlay Logo / Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-md border border-neutral-100 flex items-center justify-center p-1 font-black text-[10px] text-neutral-900">
                            {selectedMethod === 'gcash' ? (
                              <span className="text-blue-600 font-extrabold">GCash</span>
                            ) : (
                              <span className="text-emerald-600 font-extrabold">Maya</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                        No QR available
                      </div>
                    )}
                  </div>

                  {/* QR Ph Badge */}
                  <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>BSP & QR Ph Certified Standard</span>
                  </div>
                </div>

                {/* Instructions & Payment Details */}
                <div className="flex-1 space-y-3 w-full text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">
                        Total Amount Payable
                      </span>
                      <span className="text-2xl font-black text-[#F37021]">
                        ₱{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-neutral-500 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Expires in: {formatCountdown(timeLeftSec)}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">Zero Transaction Fee</span>
                    </div>
                  </div>

                  {/* Intent Reference Info */}
                  <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                    <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                      <span>Merchant Name:</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        THE MARSH BITES COMMISSARY
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                      <span>Payee Account / Mobile:</span>
                      <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                        0917-884-2104
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                      <span>Reference / Trace No:</span>
                      <div className="flex items-center space-x-1.5 font-mono font-bold text-neutral-900 dark:text-white">
                        <span>{currentIntent?.referenceNumber || 'Generating...'}</span>
                        {currentIntent?.referenceNumber && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentIntent.referenceNumber, 'ref')}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded"
                            title="Copy reference number"
                          >
                            {copiedField === 'ref' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Checkout Link Button */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {currentIntent?.checkoutUrl && (
                      <a
                        href={currentIntent.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 flex items-center space-x-1.5 shadow-xs transition-opacity"
                      >
                        <span>Open {selectedMethod.toUpperCase()} Direct Webpay</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={isVerifying}
                      className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                      <span>Check Payment Status</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sandbox Quick Simulator */}
              {isMock && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Developer Sandbox Fast-Track:
                      </span>
                      <p className="text-neutral-600 dark:text-neutral-300 text-[11px]">
                        Simulate mobile user scanning QR code and confirming payment in GCash / Maya app.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePaymentApproval}
                    disabled={isSimulatingApproval}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all flex-shrink-0"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isSimulatingApproval ? 'animate-bounce' : ''}`} />
                    <span>{isSimulatingApproval ? 'Processing Webhook...' : 'Simulate Instant Payment'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              BANK TRANSFER / INSTAPAY WORKFLOW
              ========================================================================= */}
          {selectedMethod === 'bank_transfer' && (
            <div className="space-y-4">
              {/* Bank Selector Tabs */}
              <div className="flex items-center space-x-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {COMMISSARY_BANK_ACCOUNTS.map((b, idx) => (
                  <button
                    key={b.shortName}
                    type="button"
                    onClick={() => setSelectedBankIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedBankIndex === idx
                        ? 'bg-[#F37021] text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                    }`}
                  >
                    {b.shortName}
                  </button>
                ))}
              </div>

              {/* Active Bank Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white text-sm">
                    {activeBank.bankName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    InstaPay & PESONet Enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      Account Name:
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white text-xs">
                      {activeBank.accountName}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                        Account Number:
                      </span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                        {activeBank.accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeBank.accountNumber, 'acct')}
                      className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-[#F37021]"
                      title="Copy Account Number"
                    >
                      {copiedField === 'acct' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500">
                  Branch: <strong>{activeBank.branch}</strong> • Include Order #{order.id} in transfer notes.
                </p>
              </div>

              {/* Demo Presets */}
              <div>
                <p className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5">
                  Select Demo Bank Slip Preset:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_PAYMENT_PROOFS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setProofUrlInput(preset.url);
                        setToastMessage({ type: 'info', text: `Loaded preset: ${preset.label}` });
                      }}
                      className={`p-2 rounded-xl border text-left text-xs transition-all ${
                        proofUrlInput === preset.url
                          ? 'border-[#F37021] bg-orange-50 dark:bg-orange-950/40 font-bold text-[#F37021]'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      ✓ {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proof Image URL & Reference Input */}
              <form onSubmit={handleManualProofSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Bank Transfer Reference / Trace #
                    </label>
                    <input
                      type="text"
                      required
                      value={manualReference}
                      onChange={(e) => setManualReference(e.target.value)}
                      placeholder="e.g. 20260825-BDO-84920"
                      className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Proof Screenshot Image URL
                    </label>
                    <input
                      type="url"
                      required
                      value={proofUrlInput}
                      onChange={(e) => setProofUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold rounded-xl bg-[#F37021] text-white hover:bg-[#d85e15] flex items-center space-x-1.5 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Submit Transfer Proof to HQ</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              CASH ON DELIVERY / COMMISSARY TERMS WORKFLOW
              ========================================================================= */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-neutral-900 dark:text-white">
                  <Lock className="w-4 h-4 text-[#F37021]" />
                  <span>Franchise Credit / Cash on Dispatch</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Payment will be collected by the Central Commissary Fleet Driver or verified at logistics turnover in accordance with franchise agreement guidelines.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPaymentComplete('TERMS_CASH_ON_DELIVERY', {
                      paymentMethod: 'cash',
                      status: 'PENDING',
                      referenceNumber: `COD-${order.id}`,
                    });
                  }}
                  className="px-5 py-2 font-bold rounded-xl bg-[#F37021] text-white hover:bg-[#d85e15] text-xs shadow-sm"
                >
                  Confirm Requisition on Credit / COD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
