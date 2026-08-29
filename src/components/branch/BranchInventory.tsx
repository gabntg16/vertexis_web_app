import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Package,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RotateCcw,
  Edit3,
  Sliders,
} from 'lucide-react';
import { InventorySafeguardModal, InventorySafeguardDetails } from '../safeguards/InventorySafeguardModal';

export const BranchInventory: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const {
    currentBranch,
    getInventoryForBranch,
    restockSuggestionsForBranch,
    updateStock,
    themeMode,
  } = useData();

  const [safeguardDetails, setSafeguardDetails] = useState<InventorySafeguardDetails | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [customInputVal, setCustomInputVal] = useState<string>('');

  if (!currentBranch) return null;

  const branchId = currentBranch.id;
  const inventory = getInventoryForBranch(branchId);
  const suggestions = restockSuggestionsForBranch(branchId);
  const isDark = themeMode === 'dark';

  const totalBranchUnits = inventory.reduce((sum, item) => sum + item.stock, 0);

  const handleAttemptStockChange = (itemId: string, productName: string, currentStock: number, targetStock: number) => {
    const nextStock = Math.max(0, targetStock);
    if (nextStock === currentStock) return;

    const unitsDeducted = currentStock - nextStock;
    const deductionPct = currentStock > 0 ? (unitsDeducted / currentStock) * 100 : 0;
    const isZeroing = nextStock === 0 && currentStock > 0;
    const isLargeDeduction = unitsDeducted > 0 && deductionPct > 10;

    if (isZeroing || isLargeDeduction) {
      setSafeguardDetails({
        isOpen: true,
        productName,
        currentStock,
        attemptedStock: nextStock,
        totalBranchStock: totalBranchUnits,
        reason: isZeroing ? 'zero_stock' : 'large_deduction',
        onConfirmAdjustment: () => {
          updateStock(itemId, nextStock);
          setEditingItemId(null);
        },
      });
      return;
    }

    // Safe change - execute directly
    updateStock(itemId, nextStock);
    setEditingItemId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Branch Inventory Management</h1>
          <p className="text-xs text-neutral-500 font-medium">
            Live stock counts for all 7 gourmet marshmallow flavors, manual ledger adjustments, and replenishment forecasting.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('orders')}
          className="px-4 py-2.5 rounded-xl bg-[#F37021] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#d85e15] transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>Restock from Commissary</span>
        </button>
      </div>

      {/* Restock Suggestions Section */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-[#80C7F2]/20 shadow-xs'
        }`}
      >
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold">Automated Restock Forecast</h2>
            <p className="text-xs text-neutral-500">Calculated from your branch's 14-day rolling sales velocity</p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">
            ✓ All inventory items are currently well-stocked. No immediate reorders needed.
          </p>
        ) : (
          <div className="space-y-2.5">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  s.urgency === 'Urgent'
                    ? 'bg-red-500/5 border-red-500/20'
                    : s.urgency === 'Review'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                      {s.productName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.urgency === 'Urgent'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : s.urgency === 'Review'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {s.urgency} Priority
                    </span>
                  </div>
                  <p className="text-neutral-500 mt-1">
                    Current Stock: <strong className="text-neutral-900 dark:text-white">{s.currentStock} units</strong> • Expected 7-Day Demand: <strong>{Math.ceil(s.expectedWeeklyDemand)} units</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="font-black text-sm text-[#F37021]">+{s.suggestedOrderQuantity} units</p>
                    <p className="text-[10px] text-neutral-400">suggested order</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('orders')}
                    className="px-3 py-1.5 rounded-xl bg-[#F37021] text-white text-xs font-bold hover:bg-[#d85e15] shadow-xs cursor-pointer"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flavor Stock Table with Safeguarded Adjustments */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-[#80C7F2]/20 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold">Flavor Inventory Ledger</h2>
            <p className="text-xs text-neutral-500">
              Manual stock deductions over 10% or zeroing out require safeguard confirmation.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            Total Units: {totalBranchUnits}
          </span>
        </div>

        <div className="space-y-3">
          {inventory.map((item) => {
            const isEditing = editingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                  isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50/70 border-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-black text-sm text-neutral-900 dark:text-white">
                      {item.productName}
                    </p>
                    {item.stock === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Artisanal Recipe • ₱149 SRP
                  </p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={customInputVal}
                        onChange={(e) => setCustomInputVal(e.target.value)}
                        className="w-20 p-1.5 text-center font-mono font-bold text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseInt(customInputVal, 10);
                          if (!isNaN(parsed)) {
                            handleAttemptStockChange(item.id, item.productName, item.stock, parsed);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all text-xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="px-2 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-500 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {/* Step Minus */}
                      <button
                        onClick={() =>
                          handleAttemptStockChange(
                            item.id,
                            item.productName,
                            item.stock,
                            Math.max(0, item.stock - 1)
                          )
                        }
                        className="w-8 h-8 rounded-xl border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                        title="Deduct 1 unit"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      {/* Stock display with quick edit */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(item.id);
                          setCustomInputVal(item.stock.toString());
                        }}
                        className="w-14 py-1 text-center font-black text-base text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                        title="Click to manually edit stock"
                      >
                        {item.stock}
                      </button>

                      {/* Step Plus */}
                      <button
                        onClick={() =>
                          handleAttemptStockChange(
                            item.id,
                            item.productName,
                            item.stock,
                            item.stock + 1
                          )
                        }
                        className="w-8 h-8 rounded-xl border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                        title="Add 1 unit"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Zero-Out Button */}
                      {item.stock > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAttemptStockChange(item.id, item.productName, item.stock, 0)
                          }
                          className="px-2 py-1.5 rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                          title="Zero Out Flavor Stock"
                        >
                          Set to 0
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Safeguard Modal */}
      {safeguardDetails && (
        <InventorySafeguardModal
          details={safeguardDetails}
          themeMode={themeMode}
          onClose={() => setSafeguardDetails(null)}
        />
      )}
    </div>
  );
};
