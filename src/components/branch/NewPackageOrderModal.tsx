import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Minus, Plus, X, AlertCircle } from 'lucide-react';
import { Order } from '../../types';

export interface PackageTier {
  id: 'silver' | 'gold' | 'platinum';
  name: string;
  price: number;
  baseCapacity: number;
  maxCap: number;
  rangeLabel: string;
}

export const PACKAGE_TIERS: PackageTier[] = [
  { id: 'silver', name: 'Silver', price: 3999, baseCapacity: 35, maxCap: 54, rangeLabel: '35 - 54 packs' },
  { id: 'gold', name: 'Gold', price: 5775, baseCapacity: 55, maxCap: 69, rangeLabel: '55 - 69 packs' },
  { id: 'platinum', name: 'Platinum', price: 7000, baseCapacity: 70, maxCap: 999, rangeLabel: '70+ packs' },
];

/**
 * Calculates package price with pro-rata package rates for any excess packs
 * e.g., Gold (55 packs @ ₱5,775 -> ₱105/pack). If total is 56, 5,775 + 105 = ₱5,880.00.
 */
export function calculatePackagePrice(tier: PackageTier, totalPacks: number): {
  totalPrice: number;
  isExceeded: boolean;
  excessPacks: number;
  ratePerPack: number;
} {
  const ratePerPack = tier.price / tier.baseCapacity;
  if (totalPacks === 0) {
    return { totalPrice: 0, isExceeded: false, excessPacks: 0, ratePerPack };
  }

  if (totalPacks <= tier.baseCapacity) {
    return {
      totalPrice: tier.price,
      isExceeded: false,
      excessPacks: 0,
      ratePerPack,
    };
  }

  const excessPacks = totalPacks - tier.baseCapacity;
  const totalPrice = tier.price + excessPacks * ratePerPack;

  return {
    totalPrice,
    isExceeded: true,
    excessPacks,
    ratePerPack,
  };
}

interface NewPackageOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
  initialTierId?: 'silver' | 'gold' | 'platinum';
}

export const NewPackageOrderModal: React.FC<NewPackageOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialTierId = 'gold',
}) => {
  const { products, createOrder } = useData();

  const [selectedTierId, setSelectedTierId] = useState<'silver' | 'gold' | 'platinum'>(initialTierId);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setQuantities({});
      setSelectedTierId(initialTierId);
    }
  }, [isOpen, initialTierId]);

  if (!isOpen) return null;

  const totalPacks = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0);
  const currentTier = PACKAGE_TIERS.find((t) => t.id === selectedTierId) || PACKAGE_TIERS[1];
  const isCapReached = totalPacks >= currentTier.maxCap;
  const { totalPrice, isExceeded, excessPacks } = calculatePackagePrice(currentTier, totalPacks);

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const currentQty = prev[productId] || 0;
      if (delta > 0 && totalPacks >= currentTier.maxCap) {
        return prev;
      }
      const nextQty = Math.max(0, currentQty + delta);
      return { ...prev, [productId]: nextQty };
    });
  };

  const handleDirectQtyInput = (productId: string, rawVal: string) => {
    const otherPacksTotal = Object.entries(quantities)
      .filter(([id]) => id !== productId)
      .reduce((sum, [, q]) => sum + (q || 0), 0);

    const maxAvailableForThisItem = Math.max(0, currentTier.maxCap - otherPacksTotal);

    if (rawVal === '') {
      setQuantities((prev) => ({ ...prev, [productId]: 0 }));
      return;
    }

    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      setQuantities((prev) => ({ ...prev, [productId]: 0 }));
      return;
    }

    const clamped = Math.max(0, Math.min(parsed, maxAvailableForThisItem));
    setQuantities((prev) => ({ ...prev, [productId]: clamped }));
  };

  const handleSelectTier = (tierId: 'silver' | 'gold' | 'platinum') => {
    setSelectedTierId(tierId);
    const targetTier = PACKAGE_TIERS.find((t) => t.id === tierId) || PACKAGE_TIERS[1];

    if (totalPacks > targetTier.maxCap) {
      let remainingAllowed = targetTier.maxCap;
      const adjusted: Record<string, number> = {};
      for (const [pId, qty] of Object.entries(quantities)) {
        if (remainingAllowed <= 0) {
          adjusted[pId] = 0;
        } else if (qty <= remainingAllowed) {
          adjusted[pId] = qty;
          remainingAllowed -= qty;
        } else {
          adjusted[pId] = remainingAllowed;
          remainingAllowed = 0;
        }
      }
      setQuantities(adjusted);
    }
  };

  const handlePlaceOrder = () => {
    if (totalPacks === 0) return;

    const orderItems = products
      .filter((p) => (quantities[p.id] || 0) > 0)
      .map((p) => ({
        productId: p.id,
        productName: `${p.flavor} (${p.name})`,
        quantity: quantities[p.id] || 0,
        unitPrice: Math.round((totalPrice / (totalPacks || 1)) * 100) / 100,
      }));

    const packageName = isExceeded
      ? `${currentTier.name} Package (+${excessPacks} excess packs)`
      : `${currentTier.name} Package`;

    const newOrder = createOrder(
      orderItems,
      totalPrice,
      packageName,
      currentTier.id
    );

    if (newOrder) {
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-[540px] max-h-[92vh] flex flex-col rounded-[28px] shadow-2xl overflow-hidden my-auto bg-[#59B7E8] text-slate-900 border border-[#48a2d1] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Grab Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-white/40 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-1 pb-3 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              New Package Order
            </h2>
            <p className="text-xs text-slate-700/80 mt-0.5 font-medium">
              Choose a package tier and distribute fresh gourmet marshmallow flavors
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-800 hover:bg-black/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Package Selector Cards (3 Tabs) */}
        <div className="px-6 pb-4 shrink-0">
          <div className="grid grid-cols-3 gap-2.5">
            {PACKAGE_TIERS.map((tier) => {
              const isSelected = selectedTierId === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleSelectTier(tier.id)}
                  className={`py-3 px-2 rounded-2xl text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-[#F37021] text-white shadow-md'
                      : 'bg-white text-slate-800 hover:bg-white/90 shadow-xs'
                  }`}
                >
                  <span className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {tier.name}
                  </span>
                  <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/90 font-medium' : 'text-slate-500 font-medium'}`}>
                    ₱{tier.price.toLocaleString()}
                  </span>
                  <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {tier.rangeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Flavors Distribution List */}
        <div className="px-6 overflow-y-auto space-y-2.5 flex-1 min-h-0 pb-3">
          {products.map((prod) => {
            const currentQty = quantities[prod.id] || 0;
            const isAddDisabled = isCapReached;

            return (
              <div
                key={prod.id}
                className="p-3.5 rounded-2xl bg-white text-slate-900 shadow-xs flex items-center justify-between"
              >
                <div className="pr-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {prod.flavor}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Gourmet Marshmallow Pack
                  </p>
                </div>

                {/* Stepper Controls with Direct Input */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(prod.id, -1)}
                    disabled={currentQty === 0}
                    className="w-7 h-7 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors font-bold"
                    title="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max={currentTier.maxCap}
                    value={currentQty === 0 ? '' : currentQty}
                    onChange={(e) => handleDirectQtyInput(prod.id, e.target.value)}
                    placeholder="0"
                    className="w-12 h-7 text-center font-bold text-sm text-slate-900 bg-slate-50 rounded-md border border-slate-200 focus:border-sky-500 focus:bg-white focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(prod.id, 1)}
                    disabled={isAddDisabled}
                    className="w-7 h-7 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-bold"
                    title={isAddDisabled ? 'Package capacity reached' : 'Increase quantity'}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar Container */}
        <div className="bg-[#48a5d3]/60 px-6 pt-3 pb-4 border-t border-[#419ac6] shrink-0 space-y-3">
          {/* Cap Limit or Exceed Alert Banner */}
          {isCapReached && (
            <div className="p-2.5 rounded-xl bg-red-600/80 text-white text-xs font-bold text-center leading-snug border border-red-500 flex items-center justify-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{currentTier.name} Package maximum limit reached ({currentTier.maxCap} packs).</span>
            </div>
          )}

          {isExceeded && !isCapReached && (
            <div className="p-2.5 rounded-xl bg-[#34789d]/75 text-amber-200 text-xs font-semibold text-center leading-snug border border-[#2f6f92]">
              Alert: {excessPacks} excess pack(s) added beyond base ({currentTier.baseCapacity} packs). Pro-rata rate applied.
            </div>
          )}

          {/* Totals and Place Order button */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold ${isCapReached ? 'text-red-900' : 'text-slate-800'}`}>
                Total Packs: {totalPacks} / {currentTier.maxCap < 900 ? `${currentTier.maxCap} max` : `${currentTier.baseCapacity}+`}
              </p>
              <p className="text-2xl font-black text-[#F37021] tracking-tight">
                ₱{totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={totalPacks === 0}
              className={`px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md transition-all text-center leading-tight ${
                totalPacks > 0
                  ? 'bg-[#F37021] hover:bg-[#e06214] active:scale-95 cursor-pointer'
                  : 'bg-[#F37021]/60 cursor-not-allowed opacity-75'
              }`}
            >
              Place<br />Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
