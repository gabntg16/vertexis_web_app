import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  Plus,
  Clock,
  Lock,
  Sparkles,
  Info,
  Calendar,
  Box,
} from 'lucide-react';
import { DailyInboundReceivingItem, DailyLogStatus } from '../../types';

export const StaffInboundReceiving: React.FC = () => {
  const {
    currentUser,
    currentBranch,
    products,
    dailyShiftLogs,
    addInboundToDailyLog,
    submitDailyLogForValidation,
    themeMode,
  } = useData();

  const isDark = themeMode === 'dark';
  const branchId = currentUser?.branchId || currentBranch?.id || 'b-legazpi';
  const today = new Date().toISOString().split('T')[0];

  const todayLog = useMemo(() => {
    return (dailyShiftLogs || []).find((l) => l.branchId === branchId && l.date === today);
  }, [dailyShiftLogs, branchId, today]);

  const currentStatus = todayLog?.status || DailyLogStatus.DRAFT;
  const isLocked = currentStatus === DailyLogStatus.VALIDATED_AND_LOCKED;
  const isPending = currentStatus === DailyLogStatus.PENDING_VALIDATION;
  const isEditable = !isLocked && !isPending;

  // Form State
  const [manifestNumber, setManifestNumber] = useState<string>('MNF-NAGA-2026-0902');
  const [supplierOrSource, setSupplierOrSource] = useState<string>('Naga City Commissary Hub');
  const [selectedProductId, setSelectedProductId] = useState<string>('p1');
  const [expectedUnits, setExpectedUnits] = useState<number>(20);
  const [receivedUnits, setReceivedUnits] = useState<number>(20);
  const [condition, setCondition] = useState<'good' | 'damaged' | 'shortage' | 'overage'>('good');
  const [notes, setNotes] = useState<string>('Courier J&T Express • Thermal seals intact');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const marshmallowProducts = useMemo(() => {
    return products.filter((p) => p.flavor && !p.id.startsWith('f') && !p.id.startsWith('pkg'));
  }, [products]);

  const currentProduct = products.find((p) => p.id === selectedProductId) || marshmallowProducts[0];

  const handleConfirmReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    if (receivedUnits <= 0) {
      setFeedback({ text: 'Please enter valid physical units received.', type: 'error' });
      return;
    }

    const res = addInboundToDailyLog({
      manifestNumber,
      supplierOrSource,
      productId: currentProduct.id,
      productName: `${currentProduct.flavor} (${currentProduct.name})`,
      expectedUnits,
      receivedUnits,
      condition,
      notes,
    });

    if (res.success) {
      setFeedback({
        text: `Successfully verified delivery manifest ${manifestNumber} for ${currentProduct.flavor}.`,
        type: 'success',
      });
      setNotes('');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: res.error || 'Failed to record inbound receiving.', type: 'error' });
    }
  };

  const handleSubmitForApproval = () => {
    const logId = todayLog?.id || `log-${branchId}-${today}`;
    const res = submitDailyLogForValidation(logId);
    if (res.success) {
      setFeedback({
        text: 'Inbound delivery log submitted to Branch Manager for validation.',
        type: 'success',
      });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ text: res.error || 'Submission failed.', type: 'error' });
    }
  };

  const verifiedReceivings = todayLog?.inboundReceiving || [];

  return (
    <div id="staff-inbound-receiving-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Inbound Receiving & Manifest Verification
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Inspect and tally incoming commissary shipments against physical manifests
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          {currentStatus === DailyLogStatus.DRAFT && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
              <Clock className="w-3.5 h-3.5" />
              <span>Status: DRAFT</span>
            </span>
          )}
          {currentStatus === DailyLogStatus.PENDING_VALIDATION && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Status: PENDING VALIDATION</span>
            </span>
          )}
          {currentStatus === DailyLogStatus.VALIDATED_AND_LOCKED && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
              <Lock className="w-3.5 h-3.5" />
              <span>Status: VALIDATED & LOCKED</span>
            </span>
          )}
        </div>
      </div>

      {/* Protocol Banner */}
      <div className={`p-4 rounded-2xl border ${
        isLocked
          ? 'bg-neutral-100 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800'
          : isPending
          ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50'
          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
      }`}>
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <span className="font-bold text-neutral-900 dark:text-white">Delivery Verification Standards:</span>{' '}
            Frontline staff must physically count boxes arriving from Naga City Commissary Hub. Compare received quantity against the printed waybill/manifest. Note any seal ruptures or transit damage immediately.
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Form + Verified Manifests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Manifest Verification Form: 5 cols */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4 flex items-center space-x-2">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Verify Inbound Delivery</span>
          </h2>

          <form onSubmit={handleConfirmReceiving} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Manifest / Waybill Number
              </label>
              <input
                type="text"
                value={manifestNumber}
                disabled={!isEditable}
                onChange={(e) => setManifestNumber(e.target.value)}
                placeholder="e.g. MNF-NAGA-2026-0902"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Dispatch Source
              </label>
              <input
                type="text"
                value={supplierOrSource}
                disabled={!isEditable}
                onChange={(e) => setSupplierOrSource(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Gourmet Marshmallow Item
              </label>
              <select
                value={selectedProductId}
                disabled={!isEditable}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              >
                {marshmallowProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.flavor} ({p.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Expected (Waybill)
                </label>
                <input
                  type="number"
                  min="1"
                  value={expectedUnits}
                  disabled={!isEditable}
                  onChange={(e) => setExpectedUnits(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Actual Physical Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={receivedUnits}
                  disabled={!isEditable}
                  onChange={(e) => setReceivedUnits(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Physical Cargo Condition
              </label>
              <select
                value={condition}
                disabled={!isEditable}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              >
                <option value="good">Good / Intact & Cold Sealed</option>
                <option value="damaged">Packaging Ruptured / Damaged</option>
                <option value="shortage">Shortage (Missing Packs)</option>
                <option value="overage">Overage (Excess Packs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Courier & Waybill Notes
              </label>
              <input
                type="text"
                value={notes}
                disabled={!isEditable}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Courier plate #, tamper tag intact"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              />
            </div>

            <button
              type="submit"
              disabled={!isEditable}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all ${
                isEditable
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-neutral-400 dark:bg-neutral-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Inbound Verification</span>
            </button>
          </form>
        </div>

        {/* Right Table: Verified Deliveries: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] shadow-xs">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Deliveries in Current Shift</span>
              </span>
              <span className="text-xs font-mono text-neutral-400">{verifiedReceivings.length} verified</span>
            </div>

            {verifiedReceivings.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No inbound deliveries logged in this shift yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50 text-[11px] font-bold uppercase text-neutral-500">
                      <th className="py-2.5 px-3">Manifest #</th>
                      <th className="py-2.5 px-3">Item Received</th>
                      <th className="py-2.5 px-2 text-center">Exp</th>
                      <th className="py-2.5 px-2 text-center">Recv</th>
                      <th className="py-2.5 px-3">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {verifiedReceivings.map((entry) => (
                      <tr key={entry.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900 dark:text-white">
                          <div>{entry.manifestNumber}</div>
                          <div className="text-[10px] text-neutral-400 font-normal">{entry.supplierOrSource}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          <div>{entry.productName}</div>
                          {entry.notes && <div className="text-[11px] text-neutral-400 font-normal italic">{entry.notes}</div>}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-neutral-500">
                          {entry.expectedUnits}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {entry.receivedUnits}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            entry.condition === 'good'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                            {entry.condition.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={!isEditable}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all ${
                isEditable
                  ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-neutral-400 dark:bg-neutral-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submit Log for Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
