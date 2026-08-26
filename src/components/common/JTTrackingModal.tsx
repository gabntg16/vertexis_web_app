import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Phone,
  Building,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  jtExpressService,
  JTTrackingResponse,
  mapJTStatusToVertexStatus,
  JTScanStatus,
  isJTMockMode,
} from '../../services/jtExpress';

interface JTTrackingModalProps {
  trackingNumber: string;
  orderId?: string;
  branchName?: string;
  themeMode?: 'light' | 'dark';
  onClose: () => void;
  onStatusUpdated?: (status: string) => void;
}

export const JTTrackingModal: React.FC<JTTrackingModalProps> = ({
  trackingNumber,
  orderId,
  branchName,
  themeMode = 'light',
  onClose,
  onStatusUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<JTTrackingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDark = themeMode === 'dark';

  const fetchTracking = async () => {
    try {
      setErrorMsg(null);
      const data = await jtExpressService.trackShipment(trackingNumber);
      setTrackingData(data);
      if (onStatusUpdated) {
        onStatusUpdated(data.currentStatus);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch live J&T tracking updates.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [trackingNumber]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTracking();
  };

  const handleQuickAdvanceMock = (nextStatus: JTScanStatus) => {
    jtExpressService.setMockStatusOverride(trackingNumber, nextStatus);
    handleRefresh();
  };

  const getStepProgress = (status: JTScanStatus) => {
    switch (status) {
      case 'ORDER_CREATED':
        return 1;
      case 'PICKED_UP':
      case 'DEPARTED_ORIGIN':
        return 2;
      case 'IN_TRANSIT':
        return 3;
      case 'ARRIVED_DEST_HUB':
        return 4;
      case 'OUT_FOR_DELIVERY':
        return 5;
      case 'DELIVERED':
        return 6;
      default:
        return 2;
    }
  };

  const currentStep = trackingData ? getStepProgress(trackingData.currentStatus) : 1;
  const mappedStatus = trackingData ? mapJTStatusToVertexStatus(trackingData.currentStatus) : null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl p-6 shadow-2xl border my-auto ${
          isDark ? 'bg-[#1a1a1a] border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-[#E30613] text-white font-black text-[11px] tracking-wider">
                J&T EXPRESS
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500">
                WAYBILL #{trackingNumber}
              </span>
              {orderId && (
                <span className="text-xs text-neutral-400">
                  (Order #{orderId})
                </span>
              )}
            </div>
            <h2 className="text-lg font-black tracking-tight">
              Real-Time Shipment Tracking
            </h2>
            <p className="text-xs text-neutral-500">
              Naga City Central Commissary ➔ {branchName || 'Franchise Branch'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all ${
                isRefreshing ? 'animate-spin text-[#F37021]' : ''
              }`}
              title="Refresh live status from J&T Gateway"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#F37021] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-neutral-400">
                Connecting to J&T Express Open Platform gateway...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="font-bold text-sm text-red-600 dark:text-red-400">Tracking Query Error</h3>
              <p className="text-xs text-neutral-400">{errorMsg}</p>
              <button
                onClick={fetchTracking}
                className="mt-2 px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Retry Query
              </button>
            </div>
          ) : trackingData ? (
            <>
              {/* Status Overview Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  trackingData.isDelivered
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : trackingData.isException
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isDark
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                        mappedStatus?.badgeColor || 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{trackingData.statusLabel}</span>
                    </span>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mt-2">
                      {trackingData.statusDescription}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[11px] text-neutral-400">Estimated Delivery</p>
                    <p className="text-sm font-black text-neutral-900 dark:text-white">
                      {trackingData.estimatedDeliveryDate || '1-2 Days'}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                      Hub Code: {trackingData.sortingCode}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 mb-1.5 px-1">
                    <span className={currentStep >= 1 ? 'text-[#F37021]' : ''}>Pickup</span>
                    <span className={currentStep >= 3 ? 'text-[#F37021]' : ''}>Transit Hub</span>
                    <span className={currentStep >= 5 ? 'text-[#F37021]' : ''}>Out for Delivery</span>
                    <span className={currentStep >= 6 ? 'text-emerald-500 font-extrabold' : ''}>Delivered</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        trackingData.isDelivered ? 'bg-emerald-500' : 'bg-[#F37021]'
                      }`}
                      style={{ width: `${Math.min(100, (currentStep / 6) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Courier Rider Information (If Out for Delivery) */}
              {trackingData.courierRider && trackingData.currentStatus === 'OUT_FOR_DELIVERY' && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        Assigned Courier Rider: {trackingData.courierRider.name}
                      </p>
                      <p className="text-neutral-500 text-[11px]">
                        Vehicle: {trackingData.courierRider.plateNumber || 'Motorcycle Unit'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${trackingData.courierRider.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Rider</span>
                  </a>
                </div>
              )}

              {/* Transit Event History Timeline */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Scan History & Checkpoint Logs
                </h3>

                <div className="space-y-3 pl-2 border-l-2 border-neutral-200 dark:border-neutral-800 ml-3">
                  {trackingData.events.map((ev, index) => {
                    const isLatest = index === 0;
                    return (
                      <div key={index} className="relative pl-5 text-xs group">
                        {/* Timeline Pin */}
                        <div
                          className={`absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            isLatest
                              ? 'bg-[#F37021] border-white dark:border-[#1a1a1a] shadow-xs scale-110 ring-2 ring-[#F37021]/30'
                              : 'bg-neutral-300 dark:bg-neutral-700 border-white dark:border-[#1a1a1a]'
                          }`}
                        />

                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span
                              className={`font-bold ${
                                isLatest
                                  ? 'text-neutral-900 dark:text-white font-black'
                                  : 'text-neutral-600 dark:text-neutral-400'
                              }`}
                            >
                              {ev.statusLabel}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {new Date(ev.scanTime).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                            {ev.desc}
                          </p>

                          <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 pt-0.5">
                            <MapPin className="w-3 h-3 text-[#F37021] shrink-0" />
                            <span>{ev.location}</span>
                            {ev.operatorName && <span>• Handler: {ev.operatorName}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Developer Sandbox Stage Stepper (Mock Mode Only) */}
              {isJTMockMode() && (
                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px] text-neutral-500 flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sandbox Stage Simulator (Dev Testing):</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">Mock Mode Active</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                    {[
                      { key: 'ORDER_CREATED', label: '1. Created' },
                      { key: 'PICKED_UP', label: '2. Picked Up' },
                      { key: 'IN_TRANSIT', label: '3. In Transit' },
                      { key: 'ARRIVED_DEST_HUB', label: '4. Dest Hub' },
                      { key: 'OUT_FOR_DELIVERY', label: '5. Out for Del.' },
                      { key: 'DELIVERED', label: '6. Delivered' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        onClick={() => handleQuickAdvanceMock(st.key as JTScanStatus)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          trackingData.currentStatus === st.key
                            ? 'bg-[#F37021] text-white shadow-xs'
                            : 'bg-white dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-[11px] text-neutral-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official J&T Open Platform Gateway Synchronized</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
