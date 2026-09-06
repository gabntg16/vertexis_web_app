import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  Trash2,
  AlertTriangle,
  Flame,
  Snowflake,
  PackageX,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Info,
  Send,
  Plus,
} from 'lucide-react';
import { DailyLogStatus, DailySpoilageItem, SpoilageReason } from '../../types';

const SPOILAGE_REASONS: { label: SpoilageReason; description: string; icon: string }[] = [
  {
    label: 'Expired Shelf Life',
    description: 'Passed 30-day recommended fresh gourmet shelf life',
    icon: '⏳',
  },
  {
    label: 'Melted / Heat Damaged',
    description: 'Deformed or melted due to ambient heat/sunlight exposure',
    icon: '🔥',
  },
  {
    label: 'Packaging Seal Compromised',
    description: 'Pouch puncture, zip lock tear, or unsealed packaging',
    icon: '📦',
  },
  {
    label: 'Dropped / Crushed in Handling',
    description: 'Physical deformation from accidental in-store dropping',
    icon: '💥',
  },
  {
    label: 'Quality Defect',
    description: 'Flavor texture anomaly or discoloration observed upon opening',
    icon: '⚠️',
  },
  {
    label: 'Transit / Delivery Damage',
    description: 'Packs crushed or damaged upon courier delivery arrival',
    icon: '🚚',
  },
];

export const StaffWastageLog: React.FC = () => {
  const {
    currentUser,
    currentBranch,
    products,
    dailyShiftLogs,
    addSpoilageToDailyLog,
    submitDailyLogForValidation,
    themeMode,
  } = useData();

  const isDark = themeMode === 'dark';
  const branchId = currentUser?.branchId || currentBranch?.id || 'b-legazpi';
  const today = new Date().toISOString().split('T')[0];

  const todayLog = useMemo(() => {
    return dailyShiftLogs.find((l) => l.branchId === branchId && l.date === today);
  }, [dailyShiftLogs, branchId, today]);

  const currentStatus = todayLog?.status || DailyLogStatus.DRAFT;
  const isLocked = currentStatus === DailyLogStatus.VALIDATED_AND_LOCKED;
  const isPending = currentStatus === DailyLogStatus.PENDING_VALIDATION;
  const isEditable = !isLocked && !isPending;

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('p1');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedReason, setSelectedReason] = useState<SpoilageReason>('Packaging Seal Compromised');
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const marshmallowProducts = useMemo(() => {
    return products.filter((p) => p.flavor && !p.id.startsWith('f') && !p.id.startsWith('pkg'));
  }, [products]);

  const currentProduct = products.find((p) => p.id === selectedProductId) || marshmallowProducts[0];

  const handleAddWastage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    if (quantity <= 0) {
      setFeedback({ text: 'Please enter a valid wastage quantity greater than 0.', type: 'error' });
      return;
    }

    const res = addSpoilageToDailyLog({
      productId: currentProduct.id,
      productName: currentProduct.name,
      flavor: currentProduct.flavor,
      quantity,
      reason: selectedReason,
      notes,
      costImpact: quantity * (currentProduct.wholesalePrice || 100),
    });

    if (res.success) {
      setFeedback({ text: `Logged ${quantity} units of ${currentProduct.flavor} as wastage.`, type: 'success' });
      setQuantity(1);
      setNotes('');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: res.error || 'Failed to log wastage.', type: 'error' });
    }
  };

  const handleSubmitForApproval = () => {
    const logId = todayLog?.id || `log-${branchId}-${today}`;
    const res = submitDailyLogForValidation(logId);
    if (res.success) {
      setFeedback({
        text: 'Wastage report submitted to Branch Manager for validation & lock.',
        type: 'success',
      });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ text: res.error || 'Submission failed.', type: 'error' });
    }
  };

  const currentShiftSpoilage = todayLog?.spoilageEntries || [];
  const totalWastageUnits = currentShiftSpoilage.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalWastageCost = currentShiftSpoilage.reduce((acc, curr) => acc + curr.costImpact, 0);

  return (
    <div id="staff-wastage-log-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Spoilage & Wastage Entry
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Log damaged, dropped, expired, or defective gourmet marshmallow units
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

      {/* Role Boundary Notice */}
      <div className={`p-4 rounded-2xl border ${
        isLocked
          ? 'bg-neutral-100 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800'
          : isPending
          ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50'
          : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
      }`}>
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <span className="font-bold text-neutral-900 dark:text-white">Frontline Loss Entry Rules:</span>{' '}
            Branch staff must document every physical pack pulled from the display or storage bins. All spoilage entries require a specific failure category and brief explanation for commissary batch tracking.
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

      {/* Main Grid: Entry Form + Today's Wastage Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Record Damaged Item</span>
          </h2>

          <form onSubmit={handleAddWastage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Gourmet Marshmallow Flavor
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

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Quantity Damaged (Packs)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                disabled={!isEditable}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Failure / Spoilage Reason
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {SPOILAGE_REASONS.map((r) => (
                  <label
                    key={r.label}
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedReason === r.label
                        ? 'border-[#80C7F2] bg-[#80C7F2]/10 text-neutral-900 dark:text-white font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="spoilageReason"
                      value={r.label}
                      checked={selectedReason === r.label}
                      disabled={!isEditable}
                      onChange={() => setSelectedReason(r.label)}
                      className="mt-0.5 text-[#0369a1]"
                    />
                    <div className="text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-normal">{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Staff Incident Description & Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                disabled={!isEditable}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Broken pouch dropped from storage shelf during morning restock"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#121212] text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#80C7F2]"
              />
            </div>

            <button
              type="submit"
              disabled={!isEditable}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all ${
                isEditable
                  ? 'bg-red-600 hover:bg-red-700 active:scale-98 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-neutral-400 dark:bg-neutral-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Log Spoilage Entry</span>
            </button>
          </form>
        </div>

        {/* Right Table: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Total Spoilage Units</div>
              <div className="mt-1 text-2xl font-black text-red-600 dark:text-red-400">
                {totalWastageUnits} <span className="text-xs font-normal text-neutral-400">packs</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Cost Impact Value</div>
              <div className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">
                ₱{totalWastageCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Current Shift Spoilage Records */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] shadow-xs">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center justify-between">
              <span>Today's Shift Spoilage Records</span>
              <span className="text-xs font-mono text-neutral-400">{currentShiftSpoilage.length} logged</span>
            </div>

            {currentShiftSpoilage.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No spoilage logged for this shift yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50 text-[11px] font-bold uppercase text-neutral-500">
                      <th className="py-2.5 px-3">Item / Flavor</th>
                      <th className="py-2.5 px-3">Failure Reason</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {currentShiftSpoilage.map((entry) => (
                      <tr key={entry.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                        <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-white">
                          <div>{entry.flavor}</div>
                          {entry.notes && <div className="text-[11px] text-neutral-400 font-normal italic">{entry.notes}</div>}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                            {entry.reason}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-neutral-900 dark:text-white">
                          {entry.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                          ₱{entry.costImpact.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Submit Action */}
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
