import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  User,
  Phone,
  Building,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  Plus,
  Send,
  Boxes,
} from 'lucide-react';
import {
  jtExpressService,
  JTCreateOrderRequest,
  JTShippingLabelData,
  mapJTStatusToVertexStatus,
  isJTMockMode,
  COMMISSARY_SENDER,
  resolveDestinationHub,
} from '../../services/jtExpress';
import { JTShippingLabel } from '../common/JTShippingLabel';
import { JTTrackingModal } from '../common/JTTrackingModal';
import { Delivery, Order, DispatchMethod } from '../../types';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const AdminDispatch: React.FC = () => {
  const {
    deliveries,
    orders,
    branches,
    themeMode,
    createDelivery,
    updateDeliveryStatus,
    cancelDelivery,
    updateOrderProductionStage,
  } = useData();

  const isDark = themeMode === 'dark';

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'jt_active' | 'fleet'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [activeTrackingNumber, setActiveTrackingNumber] = useState<string | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<{ id: string; branch: string } | null>(null);
  const [activeLabelData, setActiveLabelData] = useState<JTShippingLabelData | null>(null);
  const [cancelModalDelivery, setCancelModalDelivery] = useState<Delivery | null>(null);
  const [cancelReason, setCancelReason] = useState('Order rescheduled by branch manager');

  // Dispatch Form States
  const [dispatchMethod, setDispatchMethod] = useState<DispatchMethod>('jt_express');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverProvince, setReceiverProvince] = useState('');
  const [packageWeightKg, setPackageWeightKg] = useState<number>(3.5);
  const [declaredValue, setDeclaredValue] = useState<number>(15000);
  const [driverName, setDriverName] = useState('Mang Robert (Commissary Driver)');
  const [vehiclePlateNo, setVehiclePlateNo] = useState('BCO-8821 (Naga Van)');
  const [driverPhone, setDriverPhone] = useState('+63 917 884 2104');
  const [deliveryNotes, setDeliveryNotes] = useState('Keep dry, perishable gourmet marshmallows.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Helper to prefill receiver details when branch is chosen
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setReceiverName(branch.managerName || `${branch.name} Store Manager`);
      setReceiverPhone(branch.managerPhone || branch.contactNumber || '+63 917 555 0192');
      setReceiverAddress(branch.address || branch.location || `${branch.name}, Main Commercial Strip`);
      // Parse city/province if available
      const locParts = (branch.address || branch.location || '').split(',');
      if (locParts.length >= 2) {
        setReceiverCity(locParts[locParts.length - 2]?.trim() || 'Metro Manila');
        setReceiverProvince(locParts[locParts.length - 1]?.trim() || 'NCR');
      } else {
        setReceiverCity(branch.location || 'Metro Manila');
        setReceiverProvince('Philippines');
      }
    }
  };

  // Open dispatch modal for an approved order
  const handleOpenDispatchForOrder = (order: Order) => {
    setSelectedOrderForDispatch(order);
    setSelectedBranchId(order.branchId);
    handleBranchSelect(order.branchId);

    // Calculate pouch count & weight
    const totalPacks = order.items.reduce((sum, it) => sum + it.quantity, 0);
    const estWeight = Math.max(1.5, Math.round(totalPacks * 0.12 * 10) / 10);
    setPackageWeightKg(estWeight);
    setDeclaredValue(order.totalAmount || 12000);
    setShowDispatchModal(true);
  };

  // Handle Dispatch Submission (Company Driver or J&T Express)
  const handleExecuteDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch) return;

    if (dispatchMethod === 'jt_express') {
      if (!receiverAddress || receiverAddress.trim().length < 5) {
        showToast('error', 'Please enter a complete branch destination address.');
        return;
      }
      if (!receiverPhone || receiverPhone.trim().length < 7) {
        showToast('error', 'Branch contact phone number is required for J&T Express delivery.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (dispatchMethod === 'jt_express') {
        // Build J&T Create Order Request
        const jtRequest: JTCreateOrderRequest = {
          orderId: selectedOrderForDispatch.id,
          sender: COMMISSARY_SENDER,
          receiver: {
            name: receiverName || 'Branch Store Manager',
            mobile: receiverPhone,
            phone: receiverPhone,
            address: receiverAddress,
            city: receiverCity || 'Metro Manila',
            province: receiverProvince || 'NCR',
            branchCode: selectedOrderForDispatch.branchId,
            branchName: selectedOrderForDispatch.branchName,
          },
          items: selectedOrderForDispatch.items.map((it) => ({
            itemName: it.productName,
            itemQuantity: it.quantity,
            itemValue: it.unitPrice || 149,
            itemWeight: 0.12,
            englishName: 'Gourmet Marshmallows',
          })),
          packageType: 'EXPRESS',
          serviceType: 'EZ',
          weightKg: packageWeightKg,
          declaredValue: declaredValue,
          remark: deliveryNotes,
          isFragile: true,
          isPerishable: true,
        };

        // Call J&T Open Platform API
        const jtResponse = await jtExpressService.createOrder(jtRequest);
        if (!jtResponse.success || !jtResponse.data) {
          throw new Error(jtResponse.message || 'J&T Gateway returned an unsuccessful response.');
        }

        const billCode = jtResponse.data.billCode;
        const sortingCode = jtResponse.data.sortingCode;

        // Create Delivery entry in DataContext
        const newDel = createDelivery(
          selectedOrderForDispatch.id,
          receiverAddress,
          'J&T Express Philippines',
          billCode,
          new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
          deliveryNotes,
          {
            dispatchMethod: 'jt_express',
            waybillNumber: billCode,
            jtSortingCode: sortingCode,
            receiverContact: receiverName,
            receiverPhone: receiverPhone,
            weightKg: packageWeightKg,
          }
        );

        // Prepare Shipping Label for immediate print preview
        const labelData = jtExpressService.prepareShippingLabel(
          billCode,
          selectedOrderForDispatch.id,
          jtRequest.receiver,
          jtRequest.items,
          {
            weightKg: packageWeightKg,
            declaredValue,
            serviceType: jtResponse.data.serviceType,
          }
        );

        setShowDispatchModal(false);
        setActiveLabelData(labelData);
        showToast(
          'success',
          `J&T Express Waybill ${billCode} generated successfully! Hub Routing: ${sortingCode}`
        );
      } else {
        // Company Driver Dispatch
        const trackingRef = `MB-FLEET-${Date.now().toString().slice(-6)}`;
        createDelivery(
          selectedOrderForDispatch.id,
          receiverAddress,
          'Marsh Bites In-House Fleet',
          trackingRef,
          new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
          `${deliveryNotes} | Driver: ${driverName} (${vehiclePlateNo})`,
          {
            dispatchMethod: 'company_driver',
            waybillNumber: trackingRef,
            driverName,
            vehiclePlateNo,
            receiverContact: receiverName,
            receiverPhone: receiverPhone,
          }
        );

        setShowDispatchModal(false);
        showToast(
          'success',
          `Order #${selectedOrderForDispatch.id} dispatched via In-House Fleet (${driverName})`
        );
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to dispatch shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View J&T Label for existing delivery
  const handleViewExistingLabel = (delivery: Delivery) => {
    const order = orders.find((o) => o.id === delivery.orderId);
    const branch = branches.find((b) => b.id === delivery.branchId);

    const items = order
      ? order.items.map((it) => ({
          itemName: it.productName,
          itemQuantity: it.quantity,
          itemValue: it.unitPrice || 149,
          itemWeight: 0.12,
        }))
      : [{ itemName: 'Marshmallow Restock Cartons', itemQuantity: 1, itemValue: 12000, itemWeight: 3.5 }];

    const labelData = jtExpressService.prepareShippingLabel(
      delivery.waybillNumber || delivery.trackingNumber || 'JTPH8821094',
      delivery.orderId,
      {
        name: delivery.receiverContact || branch?.managerName || 'Branch Manager',
        mobile: delivery.receiverPhone || branch?.managerPhone || branch?.contactNumber || '+63 917 555 0192',
        address: delivery.address || branch?.address || 'Branch Store',
        city: branch?.location || 'Metro Manila',
        province: 'NCR',
        branchName: branch?.name || 'Marsh Bites Franchise',
      },
      items,
      {
        weightKg: delivery.weightKg || 3.5,
        declaredValue: order?.totalAmount || 15000,
      }
    );

    setActiveLabelData(labelData);
  };

  // Open Real-Time J&T Tracking Modal
  const handleOpenTracking = (delivery: Delivery) => {
    const trackNo = delivery.waybillNumber || delivery.trackingNumber;
    if (!trackNo) {
      showToast('info', 'No tracking number found for this shipment.');
      return;
    }
    const branch = branches.find((b) => b.id === delivery.branchId);
    setActiveTrackingNumber(trackNo);
    setActiveTrackingOrder({
      id: delivery.orderId,
      branch: branch?.name || 'Franchise Branch',
    });
  };

  // Handle Cancellation of Shipment
  const handleConfirmCancel = async () => {
    if (!cancelModalDelivery) return;
    try {
      if (cancelModalDelivery.dispatchMethod === 'jt_express' && cancelModalDelivery.trackingNumber) {
        await jtExpressService.cancelOrder(cancelModalDelivery.trackingNumber, cancelReason);
      }
      cancelDelivery(cancelModalDelivery.id, cancelReason);
      showToast(
        'info',
        `Shipment ${cancelModalDelivery.trackingNumber || cancelModalDelivery.id} cancelled.`
      );
      setCancelModalDelivery(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to cancel shipment.');
    }
  };

  // Pending approved orders ready for dispatch
  const pendingDispatchOrders = orders.filter(
    (o) => (o.status === 'approved' || o.productionStage === 'ready_for_dispatch') && !o.isDispatched
  );

  // Filtered Deliveries List
  const filteredDeliveries = deliveries.filter((del) => {
    const order = orders.find((o) => o.id === del.orderId);
    const branch = branches.find((b) => b.id === del.branchId);
    const matchesSearch =
      del.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (del.trackingNumber && del.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (del.waybillNumber && del.waybillNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (del.courierName && del.courierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (branch && branch.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      del.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || del.status === statusFilter;

    const isJT = del.dispatchMethod === 'jt_express' || (del.courierName && del.courierName.toLowerCase().includes('j&t'));
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'jt_active'
        ? isJT
        : activeTab === 'fleet'
        ? !isJT
        : true;

    return matchesSearch && matchesStatus && matchesTab;
  });

  // Calculate Metrics
  const jtCount = deliveries.filter(
    (d) => d.dispatchMethod === 'jt_express' || (d.courierName && d.courierName.toLowerCase().includes('j&t'))
  ).length;
  const fleetCount = deliveries.filter((d) => d.dispatchMethod === 'company_driver').length;
  const inTransitCount = deliveries.filter((d) => d.status === 'inTransit').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-80 max-w-md p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 transition-all animate-bounce-short ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toast.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-sky-600 text-white border-sky-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 shrink-0" />
          )}
          <p className="text-xs font-bold leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border relative overflow-hidden ${
          isDark
            ? 'bg-linear-to-r from-[#1c1c1c] via-[#221a14] to-[#1a1a1a] border-neutral-800'
            : 'bg-linear-to-r from-orange-50/70 via-sky-50/50 to-white border-neutral-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#E30613] text-white flex items-center space-x-1">
                <span>J&T EXPRESS</span>
                <span className="font-light">OPEN PLATFORM</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#80C7F2]/20 text-[#1a7bb5] dark:text-[#80C7F2] border border-[#80C7F2]/30">
                Naga Central Commissary Hub (BCO-NGA-01)
              </span>
              {isJTMockMode() && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  ⚡ Sandbox Mode Active
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              Fleet & Courier Dispatch Center
            </h1>
            <p className="text-xs text-neutral-500 max-w-2xl">
              Automated J&T Express waybill generation, real-time cross-island package tracking, and in-house fleet dispatch across 19 franchise branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingDispatchOrders.length > 0 && (
              <button
                onClick={() => {
                  setActiveTab('pending');
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#F37021] text-white text-xs font-bold hover:bg-[#d85e15] transition-all flex items-center space-x-2 shadow-sm animate-pulse"
              >
                <Boxes className="w-4 h-4" />
                <span>{pendingDispatchOrders.length} Ready for Dispatch</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Dispatches</span>
            <Truck className="w-4 h-4 text-[#80C7F2]" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white">{deliveries.length}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">All outbound routes</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">J&T Express</span>
            <span className="font-black text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">J&T</span>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">{jtCount}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Automated Air Waybills</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active In-Transit</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-500">{inTransitCount}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Live en route parcels</p>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Ready for Dispatch</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{pendingDispatchOrders.length}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Approved requisitions</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Shipments ({deliveries.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'pending'
                ? 'bg-[#F37021] text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Ready for Dispatch</span>
            {pendingDispatchOrders.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white text-[#F37021] text-[10px] font-black">
                {pendingDispatchOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('jt_active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'jt_active'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            J&T Express Waybills ({jtCount})
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'fleet'
                ? 'bg-[#80C7F2] text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Company Fleet ({fleetCount})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Waybill, Branch, or Ref..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#80C7F2] ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                  : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs border font-medium focus:outline-none focus:ring-1 focus:ring-[#80C7F2] ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-white'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Pickup</option>
            <option value="inTransit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* PENDING DISPATCH TAB VIEW */}
      {activeTab === 'pending' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Approved Franchise Requisitions Awaiting Dispatch ({pendingDispatchOrders.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Kitchen packaging completed at Naga Commissary. Select dispatch method below.
            </span>
          </div>

          {pendingDispatchOrders.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold">All Approved Orders Dispatched</p>
              <p className="text-xs text-neutral-400 mt-1">
                There are no approved orders pending dispatch assignment at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDispatchOrders.map((ord) => {
                const totalPacks = ord.items.reduce((s, i) => s + i.quantity, 0);
                const estWeight = Math.max(1.5, Math.round(totalPacks * 0.12 * 10) / 10);
                const branch = branches.find((b) => b.id === ord.branchId);

                return (
                  <div
                    key={ord.id}
                    className={`p-5 rounded-3xl border transition-all space-y-4 ${
                      isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-neutral-400">#{ord.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Ready for Dispatch
                          </span>
                          {ord.batchCode && (
                            <span className="font-mono text-[10px] text-neutral-500">
                              Batch: {ord.batchCode}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-neutral-900 dark:text-white mt-1">
                          {ord.branchName}
                        </h4>
                        <p className="text-xs text-neutral-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#F37021]" />
                          <span>{branch?.location || branch?.address || 'Branch Destination'}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-neutral-400">Total Value</p>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          ₱{ord.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
                      <p className="font-bold text-neutral-600 dark:text-neutral-300">Package Contents:</p>
                      <p className="text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(' • ')}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
                        <span>Total: {totalPacks} Pouches</span>
                        <span>Estimated Weight: ~{estWeight} kg</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => handleOpenDispatchForOrder(ord)}
                        className="w-full py-2.5 rounded-xl bg-linear-to-r from-[#F37021] to-[#E30613] text-white text-xs font-black hover:opacity-95 transition-all flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Shipment (J&T / Fleet)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ALL DELIVERIES / COURIER LIST VIEW */
        <div className="space-y-3.5">
          {filteredDeliveries.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <Truck className="w-12 h-12 text-neutral-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold">No Shipments Found</p>
              <p className="text-xs text-neutral-400 mt-1">
                No delivery records match your current filter criteria.
              </p>
            </div>
          ) : (
            filteredDeliveries.map((del) => {
              const order = orders.find((o) => o.id === del.orderId);
              const branch = branches.find((b) => b.id === del.branchId);
              const isJT =
                del.dispatchMethod === 'jt_express' ||
                (del.courierName && del.courierName.toLowerCase().includes('j&t'));

              const trackingNo = del.waybillNumber || del.trackingNumber;

              return (
                <div
                  key={del.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3.5 ${
                    isDark ? 'bg-[#161616] border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isJT ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center space-x-1">
                            <span>J&T EXPRESS</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#80C7F2]/20 text-[#1a7bb5] dark:text-[#80C7F2] border border-[#80C7F2]/30 flex items-center space-x-1">
                            <Truck className="w-3 h-3" />
                            <span>COMPANY FLEET</span>
                          </span>
                        )}

                        {trackingNo && (
                          <span className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                            {trackingNo}
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            del.status === 'delivered'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : del.status === 'inTransit'
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                              : del.status === 'canceled'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {del.status === 'inTransit'
                            ? 'In Transit'
                            : del.status === 'delivered'
                            ? 'Delivered'
                            : del.status === 'canceled'
                            ? 'Canceled'
                            : 'Pending Pickup'}
                        </span>

                        <span className="text-xs text-neutral-400">
                          Ref Order: #{del.orderId}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-neutral-900 dark:text-white">
                        {branch?.name || 'Destination Branch'}
                      </h4>

                      <p className="text-xs text-neutral-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#F37021] shrink-0" />
                        <span>{del.address}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {/* Live J&T Real-Time Tracking Button */}
                      {isJT && trackingNo && (
                        <button
                          onClick={() => handleOpenTracking(del)}
                          className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center space-x-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Track J&T Package</span>
                        </button>
                      )}

                      {/* Print Shipping Label */}
                      {isJT && (
                        <button
                          onClick={() => handleViewExistingLabel(del)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                          title="Print 4x6 Thermal Waybill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Waybill</span>
                        </button>
                      )}

                      {/* Quick Mark as Delivered toggle */}
                      {del.status === 'inTransit' && (
                        <button
                          onClick={() => updateDeliveryStatus(del.id, 'delivered')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {/* Cancel shipment if not delivered */}
                      {del.status !== 'delivered' && del.status !== 'canceled' && (
                        <button
                          onClick={() => setCancelModalDelivery(del)}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Cancel / Void Shipment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shipment Details Bar */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-500 gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        Carrier:{' '}
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          {del.courierName}
                        </strong>
                      </span>
                      {del.jtSortingCode && (
                        <span className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          Route: {del.jtSortingCode}
                        </span>
                      )}
                      {del.driverName && (
                        <span>
                          Driver:{' '}
                          <strong className="text-neutral-700 dark:text-neutral-300">
                            {del.driverName}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div>
                      <span>
                        Scheduled:{' '}
                        {new Date(del.scheduledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DISPATCH CREATION MODAL */}
      {showDispatchModal && selectedOrderForDispatch && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className={`w-full max-w-xl max-h-[95vh] flex flex-col rounded-3xl p-6 shadow-2xl border my-auto ${
              isDark ? 'bg-[#1c1c1c] border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-[#F37021]" />
                  <h3 className="text-base font-black">Dispatch Consignment</h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Order #{selectedOrderForDispatch.id} • {selectedOrderForDispatch.branchName}
                </p>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExecuteDispatch} className="overflow-y-auto space-y-4 py-4 pr-1">
              {/* Courier / Dispatch Method Toggle Switch */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Courier / Dispatch Method
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setDispatchMethod('jt_express')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                      dispatchMethod === 'jt_express'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="px-1.5 py-0.5 rounded bg-white text-red-600 text-[10px] font-black">
                      J&T
                    </span>
                    <span>J&T Express (API)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchMethod('company_driver')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                      dispatchMethod === 'company_driver'
                        ? 'bg-[#80C7F2] text-neutral-900 shadow-md'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Company Driver Fleet</span>
                  </button>
                </div>
              </div>

              {/* J&T Express Specific Auto-Populated Form */}
              {dispatchMethod === 'jt_express' ? (
                <div className="space-y-3.5 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>J&T Express Open Platform Auto-Population</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Destination: {resolveDestinationHub(receiverAddress || receiverCity).hubCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Receiver / Branch Manager
                      </label>
                      <input
                        type="text"
                        required
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="Store Manager Name"
                        className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-red-500 ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Receiver Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-red-500 ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Complete Delivery Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      placeholder="Unit / Building, Street, Barangay"
                      className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-red-500 ${
                        isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">City</label>
                      <input
                        type="text"
                        value={receiverCity}
                        onChange={(e) => setReceiverCity(e.target.value)}
                        className={`w-full p-2 rounded-xl text-xs border ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">Province</label>
                      <input
                        type="text"
                        value={receiverProvince}
                        onChange={(e) => setReceiverProvince(e.target.value)}
                        className={`w-full p-2 rounded-xl text-xs border ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">Weight (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={packageWeightKg}
                        onChange={(e) => setPackageWeightKg(parseFloat(e.target.value) || 1)}
                        className={`w-full p-2 rounded-xl text-xs border font-mono ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">Value (PHP)</label>
                      <input
                        type="number"
                        value={declaredValue}
                        onChange={(e) => setDeclaredValue(parseInt(e.target.value) || 5000)}
                        className={`w-full p-2 rounded-xl text-xs border font-mono ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Company Driver Specific Form */
                <div className="space-y-3.5 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20">
                  <span className="text-[11px] font-bold text-sky-600 dark:text-[#80C7F2] uppercase tracking-wider flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>In-House Commissary Fleet Assignment</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Assigned Driver
                      </label>
                      <input
                        type="text"
                        required
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Mang Robert"
                        className={`w-full p-2.5 rounded-xl text-xs border ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                        Vehicle Plate No.
                      </label>
                      <input
                        type="text"
                        required
                        value={vehiclePlateNo}
                        onChange={(e) => setVehiclePlateNo(e.target.value)}
                        placeholder="e.g. BCO-8821 (Van #1)"
                        className={`w-full p-2.5 rounded-xl text-xs border ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      required
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border ${
                        isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Handling Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">
                  Handling Instructions & Transit Notes
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Perishable gourmet marshmallows. Keep below 28°C..."
                  className={`w-full p-2.5 rounded-xl text-xs border ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                  }`}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 font-medium text-xs rounded-xl border border-neutral-300 dark:border-neutral-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 font-black text-xs rounded-xl text-white transition-all shadow-md flex items-center space-x-2 ${
                    dispatchMethod === 'jt_express'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#F37021] hover:bg-[#d85e15]'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Waybill...</span>
                    </>
                  ) : dispatchMethod === 'jt_express' ? (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Generate J&T Waybill & Dispatch</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" />
                      <span>Confirm Fleet Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL SHIPMENT MODAL */}
      {cancelModalDelivery && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              isDark ? 'bg-[#1c1c1c] border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center space-x-2 text-red-500 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">Cancel Shipment & Void Waybill</h3>
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Are you sure you want to cancel delivery for Order #{cancelModalDelivery.orderId} (
              {cancelModalDelivery.waybillNumber || cancelModalDelivery.trackingNumber})? This will notify J&T Express to void the waybill and revert the order status to approved.
            </p>

            <div className="space-y-1 mb-4">
              <label className="text-[11px] font-bold text-neutral-400">Cancellation Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className={`w-full p-2 rounded-xl text-xs border ${
                  isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300'
                }`}
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setCancelModalDelivery(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700"
              >
                Keep Active
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME J&T TRACKING MODAL */}
      {activeTrackingNumber && (
        <JTTrackingModal
          trackingNumber={activeTrackingNumber}
          orderId={activeTrackingOrder?.id}
          branchName={activeTrackingOrder?.branch}
          themeMode={themeMode}
          onClose={() => {
            setActiveTrackingNumber(null);
            setActiveTrackingOrder(null);
          }}
        />
      )}

      {/* PRINTABLE J&T SHIPPING LABEL */}
      {activeLabelData && (
        <JTShippingLabel
          labelData={activeLabelData}
          onClose={() => setActiveLabelData(null)}
        />
      )}
    </div>
  );
};
