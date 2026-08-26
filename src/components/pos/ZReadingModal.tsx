import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { CashDenominationCount, ShiftClosingRecord } from '../../types';
import {
  Printer,
  X,
  Lock,
  CheckCircle,
  AlertTriangle,
  Banknote,
  Coins,
  ShieldCheck,
  Building2,
  Calendar,
  Key,
} from 'lucide-react';

interface ZReadingModalProps {
  onClose: () => void;
  onZReadingGenerated?: (record: ShiftClosingRecord) => void;
}

const DENOMINATIONS = [
  { value: 1000, label: '₱1,000 Bill' },
  { value: 500, label: '₱500 Bill' },
  { value: 200, label: '₱200 Bill' },
  { value: 100, label: '₱100 Bill' },
  { value: 50, label: '₱50 Bill' },
  { value: 20, label: '₱20 Bill' },
  { value: 10, label: '₱10 Coin' },
  { value: 5, label: '₱5 Coin' },
  { value: 1, label: '₱1 Coin' },
];

export const ZReadingModal: React.FC<ZReadingModalProps> = ({ onClose, onZReadingGenerated }) => {
  const {
    currentBranch,
    registerShift,
    currentUser,
    getXReadingSummary,
    closeShiftAndGenerateZReading,
  } = useData();

  const summary = getXReadingSummary(currentBranch?.id);

  // Form State
  const [counts, setCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
  });

  const [cashierName, setCashierName] = useState(currentUser?.name || registerShift.cashierName || 'Cashier');
  const [managerName, setManagerName] = useState('Store Manager');
  const [managerPin, setManagerPin] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [generatedRecord, setGeneratedRecord] = useState<ShiftClosingRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculated actual cash from denominations
  const actualCashCalculated = useMemo(() => {
    return Object.entries(counts).reduce((sum, [denom, count]) => {
      return sum + Number(denom) * (Number(count) || 0);
    }, 0);
  }, [counts]);

  const cashVariance = actualCashCalculated - summary.expectedCash;

  const handleDenomChange = (denom: number, val: string) => {
    const qty = parseInt(val, 10) || 0;
    setCounts((prev) => ({ ...prev, [denom]: Math.max(0, qty) }));
  };

  const handleQuickMatchExpected = () => {
    // Fill 1000s and 500s matching expected cash for quick demo convenience
    const exp = summary.expectedCash;
    const kCount = Math.floor(exp / 1000);
    const remainder = exp % 1000;
    const fCount = Math.floor(remainder / 500);
    const r2 = remainder % 500;
    const hCount = Math.floor(r2 / 100);
    const ones = r2 % 100;

    setCounts({
      1000: kCount,
      500: fCount,
      200: 0,
      100: hCount,
      50: 0,
      20: 0,
      10: 0,
      5: 0,
      1: ones,
    });
  };

  const handleCloseShift = () => {
    setErrorMsg(null);
    const validPins = ['1234', '8888', '9999', 'admin123', 'branch123', '0000'];
    if (!managerPin || !validPins.includes(managerPin.trim())) {
      setErrorMsg('Invalid Manager PIN. Enter authorized supervisor PIN (e.g. 1234 or 8888).');
      return;
    }

    if (actualCashCalculated <= 0 && summary.expectedCash > 0) {
      setErrorMsg('Please input physical cash denomination count before executing Z-Reading closing.');
      return;
    }

    try {
      const breakdownPayload: CashDenominationCount[] = Object.entries(counts)
        .map(([denom, count]) => ({
          denomination: Number(denom),
          count: Number(count),
          total: Number(denom) * Number(count),
        }))
        .filter((b) => b.count > 0);

      const record = closeShiftAndGenerateZReading({
        cashierName,
        managerApprovedBy: managerName,
        actualCash: actualCashCalculated,
        cashBreakdown: breakdownPayload,
        notes: closingNotes,
      });

      setGeneratedRecord(record);
      if (onZReadingGenerated) {
        onZReadingGenerated(record);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate Z-Reading closing');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Header (Hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-white print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F37021] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                End-of-Day Z-Reading Closing
              </h3>
              <p className="text-xs text-neutral-400">
                Official BIR Daily Shift Settlement & Cash Float Reconciliation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {generatedRecord ? (
            /* =========================================================================
               PRINTABLE Z-READING SLIP PREVIEW
               ========================================================================= */
            <div className="font-mono text-[13px] leading-relaxed text-neutral-800 dark:text-neutral-200 print:text-black print:p-2">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-neutral-300 dark:border-neutral-700 print:border-black">
                <h1 className="text-base font-bold text-neutral-900 dark:text-white print:text-black">
                  THE MARSH BITES
                </h1>
                <p className="text-xs font-semibold">{generatedRecord.branchName}</p>
                <p className="text-[11px] text-neutral-500">{currentBranch?.location}</p>
                <div className="pt-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest print:text-black">
                  *** OFFICIAL Z-READING REPORT ***
                </div>
                <p className="text-[10px] text-neutral-400">
                  (DAILY AUDIT SLIP — RESETTABLE COUNTER CLOSED)
                </p>
              </div>

              {/* Meta */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs space-y-1 print:border-black">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Z-Report No:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 print:text-black">
                    {generatedRecord.zReadingNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Terminal / Sequence:</span>
                  <span>{generatedRecord.terminalId} / Seq #{generatedRecord.sequenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Closing Timestamp:</span>
                  <span>{new Date(generatedRecord.closedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cashier / Manager:</span>
                  <span>{generatedRecord.cashierName} / {generatedRecord.managerApprovedBy}</span>
                </div>
              </div>

              {/* OR Sequence Ranges */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs space-y-1 print:border-black">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Beginning OR No:</span>
                  <span className="font-semibold">{generatedRecord.beginningReceiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ending OR No:</span>
                  <span className="font-semibold">{generatedRecord.endingReceiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Valid Receipts:</span>
                  <span className="font-bold">{generatedRecord.totalTransactions}</span>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs space-y-1.5 print:border-black">
                <div className="flex justify-between">
                  <span>Total Gross Sales:</span>
                  <span className="font-semibold">₱{generatedRecord.totalGrossSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 print:text-black">
                  <span>Less Total Discounts:</span>
                  <span>-₱{generatedRecord.totalDiscounts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 text-neutral-900 dark:text-neutral-100 print:text-black">
                  <span>NET SALES TODAY:</span>
                  <span>₱{generatedRecord.totalNetSales.toLocaleString()}</span>
                </div>
              </div>

              {/* VAT Statutory Breakdown */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-[11px] space-y-1 text-neutral-600 dark:text-neutral-400 print:text-black">
                <div className="flex justify-between">
                  <span>VATable Sales (12%):</span>
                  <span>₱{generatedRecord.totalVatableSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>12% VAT Collected:</span>
                  <span>₱{generatedRecord.totalVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT-Exempt Sales:</span>
                  <span>₱{generatedRecord.totalVatExemptSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zero-Rated Sales:</span>
                  <span>₱{generatedRecord.totalZeroRatedSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Tender Breakdown */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs space-y-1 print:border-black">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 print:text-black">
                  Tender Summary:
                </div>
                <div className="flex justify-between">
                  <span>• Cash Sales:</span>
                  <span>₱{generatedRecord.cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• GCash / Maya:</span>
                  <span>₱{generatedRecord.digitalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Debit / Credit Card:</span>
                  <span>₱{generatedRecord.cardSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Bank Transfer:</span>
                  <span>₱{generatedRecord.bankTransferSales.toLocaleString()}</span>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs space-y-1 print:border-black">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Opening Cash Float:</span>
                  <span>₱{generatedRecord.openingFloat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Expected Cash in Drawer:</span>
                  <span>₱{generatedRecord.expectedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Actual Cash Counted:</span>
                  <span>₱{generatedRecord.actualCash.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between font-bold pt-1 ${
                  generatedRecord.cashVariance === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : generatedRecord.cashVariance > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                } print:text-black`}>
                  <span>CASH VARIANCE ({generatedRecord.cashVariance >= 0 ? 'OVER' : 'SHORT'}):</span>
                  <span>{generatedRecord.cashVariance >= 0 ? `+₱${generatedRecord.cashVariance.toLocaleString()}` : `-₱${Math.abs(generatedRecord.cashVariance).toLocaleString()}`}</span>
                </div>
              </div>

              {/* Accumulated Grand Totals (Non-resettable) */}
              <div className="py-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 text-xs space-y-1 print:border-black">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 print:text-black">
                  Non-Resettable Accumulated Totals:
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 print:text-black">
                  <span>Previous Accumulated Total:</span>
                  <span>₱{generatedRecord.previousAccumulatedGrandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 print:text-black">
                  <span>Today's Total Sales:</span>
                  <span>+₱{generatedRecord.todayAccumulatedSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 pt-1 print:text-black">
                  <span>NEW ACCUMULATED GRAND TOTAL:</span>
                  <span>₱{generatedRecord.newAccumulatedGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 pb-2 text-[11px] grid grid-cols-2 gap-6 print:text-black">
                <div className="text-center">
                  <div className="border-b border-black dark:border-white h-8 mb-1"></div>
                  <p className="font-bold">{generatedRecord.cashierName}</p>
                  <p className="text-[10px] text-neutral-500">Duty Cashier Signature</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-black dark:border-white h-8 mb-1"></div>
                  <p className="font-bold">{generatedRecord.managerApprovedBy}</p>
                  <p className="text-[10px] text-neutral-500">Branch Manager Approval</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3 print:hidden">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Close Window
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 text-xs font-medium bg-[#F37021] hover:bg-[#d95d14] text-white rounded-lg flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Z-Slip</span>
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
               Z-READING CLOSING FORM & DENOMINATION COUNTER
               ========================================================================= */
            <div className="space-y-6">
              
              {/* Summary Banner */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-medium">
                      Shift Net Sales
                    </span>
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      ₱{summary.netSales.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-medium">
                      Cash Collected
                    </span>
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      ₱{summary.cashSales.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-medium">
                      Opening Float
                    </span>
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      ₱{summary.openingFloat.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-medium">
                      Expected Cash
                    </span>
                    <span className="text-base font-bold text-[#F37021]">
                      ₱{summary.expectedCash.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Cash Drawer Denomination Counter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center space-x-1.5">
                    <Banknote className="w-4 h-4 text-[#F37021]" />
                    <span>Physical Cash Drawer Count</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickMatchExpected}
                    className="text-[11px] text-[#F37021] hover:underline font-medium"
                  >
                    Quick Auto-Count (Exact Match)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  {DENOMINATIONS.map((denom) => (
                    <div
                      key={denom.value}
                      className="p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between space-x-2"
                    >
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                          {denom.label}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          = ₱{((counts[denom.value] || 0) * denom.value).toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={counts[denom.value] || ''}
                        onChange={(e) => handleDenomChange(denom.value, e.target.value)}
                        placeholder="0"
                        className="w-16 px-2 py-1 text-right text-xs font-semibold bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:ring-1 focus:ring-[#F37021] focus:outline-hidden"
                      />
                    </div>
                  ))}
                </div>

                {/* Cash Drawer Variance Result */}
                <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-500 block">Total Actual Counted Cash:</span>
                    <span className="text-base font-bold text-neutral-900 dark:text-white">
                      ₱{actualCashCalculated.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 block">Variance (Over / Short):</span>
                    <span
                      className={`text-base font-bold ${
                        cashVariance === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : cashVariance > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {cashVariance === 0
                        ? '₱0.00 (Balanced)'
                        : cashVariance > 0
                        ? `+₱${cashVariance.toLocaleString()} (Over)`
                        : `-₱${Math.abs(cashVariance).toLocaleString()} (Short)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manager PIN & Approvals */}
              <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#F37021]" />
                  <span>Manager Approval & Shift Sign-Off</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Cashier Name
                    </label>
                    <input
                      type="text"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-[#F37021] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Approving Manager
                    </label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-[#F37021] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Manager Supervisor PIN <span className="text-neutral-400 font-normal">(e.g. 1234)</span>
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-[#F37021] focus:outline-hidden tracking-widest font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                      Closing Shift Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      placeholder="e.g. End of Sunday shift balanced"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-1 focus:ring-[#F37021] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Notice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300 text-xs">
                <p className="font-semibold">⚠️ Notice: Permanent Shift Closing</p>
                <p className="text-[11px] mt-0.5">
                  Submitting this Z-Reading closes today's register transactions, rolls over the non-resettable grand total, and records an official audit entry in the BIR closing ledger.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  className="px-5 py-2.5 text-xs font-bold bg-[#F37021] hover:bg-[#d95d14] text-white rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize & Close Z-Reading</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
