import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import marshbitesLogo from '../assets/images/marshbites_logo_1787964569459.jpg';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Building2,
  Truck,
  TrendingUp,
  Calendar,
  Megaphone,
  CreditCard,
  Boxes,
  Receipt,
  PackageCheck,
  ShieldCheck,
  Store,
  MapPin,
  UserCheck,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  RotateCcw,
  FlaskConical,
  CloudCheck,
  CloudOff,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenResetModal: () => void;
  onOpenTesterModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  onOpenResetModal,
  onOpenTesterModal,
}) => {
  const {
    currentUser,
    users,
    currentBranch,
    themeMode,
    syncState,
    toggleTheme,
    switchUser,
    logout,
    forceSyncCloud,
    pendingOrdersCount,
    readyForDispatchOrdersCount,
    deliveries,
    orders,
  } = useData();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isDark = themeMode === 'dark';

  const handleManualSync = async () => {
    try {
      setIsManualSyncing(true);
      await forceSyncCloud();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 600);
    }
  };

  // Badge counts
  const branchInTransitCount = !isAdmin && currentBranch
    ? deliveries.filter((d) => {
        const order = orders.find((o) => o.id === d.orderId);
        return order?.branchId === currentBranch.id && d.status === 'inTransit';
      }).length
    : 0;

  const branchReadyOrdersCount = !isAdmin && currentBranch
    ? orders.filter(
        (o) =>
          o.branchId === currentBranch.id &&
          (o.productionStage === 'ready_for_dispatch' || (o.productionStage as string) === 'ready') &&
          !o.isDispatched &&
          o.status !== 'completed' &&
          o.status !== 'rejected'
      ).length
    : 0;

  const adminTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders & Approvals',
      icon: ShoppingBag,
      badge:
        pendingOrdersCount + readyForDispatchOrdersCount > 0
          ? pendingOrdersCount + readyForDispatchOrdersCount
          : undefined,
      badgeColor:
        readyForDispatchOrdersCount > 0 && pendingOrdersCount === 0
          ? 'bg-emerald-500 text-white'
          : 'bg-[#F37021] text-white',
    },
    { id: 'production', label: 'Commissary Batching', icon: ChefHat },
    { id: 'branches', label: '19 Branches', icon: Building2 },
    {
      id: 'logistics',
      label: 'Fleet & Dispatch',
      icon: Truck,
      badge: readyForDispatchOrdersCount > 0 ? readyForDispatchOrdersCount : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  const branchTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'sales_pos', label: 'Counter Terminal', icon: CreditCard },
    {
      id: 'orders',
      label: 'Order Stock',
      icon: ShoppingBag,
      badge: branchReadyOrdersCount > 0 ? branchReadyOrdersCount : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    {
      id: 'logistics',
      label: 'Inbound Deliveries',
      icon: PackageCheck,
      badge: branchInTransitCount > 0 ? branchInTransitCount : undefined,
      badgeColor: 'bg-[#80C7F2] text-neutral-900',
    },
    { id: 'history', label: 'Order Slip Records', icon: Receipt },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
    { id: 'announcements', label: 'Bulletins', icon: Megaphone },
  ];

  const tabs = isAdmin ? adminTabs : branchTabs;

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xs overflow-hidden border border-neutral-200 dark:border-neutral-700 p-0.5 shrink-0">
            <img
              src={marshbitesLogo}
              alt="The Marsh Bites"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('marshbites_logo.jpg')) {
                  target.src = '/marshbites_logo.jpg';
                }
              }}
            />
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5 truncate">
                <span className="font-black tracking-tight text-lg text-neutral-900 dark:text-white leading-none">
                  Vertex<span className="text-[#F37021]">IS</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#80C7F2]/15 text-[#0369a1] dark:bg-[#80C7F2]/25 dark:text-[#80C7F2] border border-[#80C7F2]/30 leading-none">
                  Marsh Bites
                </span>
              </div>
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 truncate tracking-tight mt-1">
                {isAdmin ? 'Central Commissary HQ' : `${currentBranch?.name?.replace('Marsh Bites ', '') || 'Branch'} Station`}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role / Branch Switcher Card */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <button
            id="user-switcher-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
              isAdmin
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15'
                : 'bg-[#80C7F2]/10 border-[#80C7F2]/30 text-[#0c5077] dark:text-[#80C7F2] hover:bg-[#80C7F2]/15'
            }`}
            title="Switch User / Active Station"
          >
            <div className="flex items-center space-x-2 min-w-0">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Store className="w-4 h-4 text-[#80C7F2] shrink-0" />
              )}
              {(!isCollapsed || isMobileOpen) && (
                <div className="text-left min-w-0">
                  <span className="font-extrabold block truncate leading-tight">
                    {isAdmin ? 'HQ Administrator' : currentBranch?.name?.replace('Marsh Bites ', '') || currentUser.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                    {currentUser.name}
                  </span>
                </div>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />}
          </button>

          {/* User Switcher Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowUserMenu(false)} />
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-2xl shadow-2xl border z-50 p-2 text-xs bg-white dark:bg-[#1c1c1c] border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
                <div className="px-2 py-1.5 border-b border-neutral-200 dark:border-neutral-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Switch Active Account / Station
                  </p>
                </div>
                <div className="py-1 space-y-0.5">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#80C7F2]/20 text-[#0c5077] dark:text-[#80C7F2] font-bold'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {u.role === 'admin' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-[#80C7F2] shrink-0" />
                          )}
                          <span className="truncate">{u.name}</span>
                        </div>
                        {isSelected && <UserCheck className="w-3.5 h-3.5 text-[#80C7F2] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
        {(!isCollapsed || isMobileOpen) && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 py-1.5">
            {isAdmin ? 'Commissary Operations' : 'Branch Storefront'}
          </p>
        )}

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-[#80C7F2] text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
              }`}
              title={tab.label}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-neutral-950' : 'text-neutral-400 dark:text-neutral-400'
                  }`}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate text-left">{tab.label}</span>
                )}
              </div>

              {tab.badge !== undefined && (!isCollapsed || isMobileOpen) && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-full leading-none shrink-0 ${
                    tab.badgeColor || 'bg-red-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls / Utilities Section */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#161616]/50 space-y-2">
        {/* Firestore Sync Badge */}
        <button
          id="firestore-sync-status-btn"
          onClick={handleManualSync}
          className={`w-full flex items-center justify-between p-2 rounded-xl border text-[11px] font-semibold transition-all ${
            syncState.status === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15'
              : syncState.status === 'syncing' || isManualSyncing
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300'
              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
          }`}
          title="Cloud Firestore Synchronization Status. Click to force sync."
        >
          <div className="flex items-center space-x-2 min-w-0">
            {syncState.status === 'connected' && !isManualSyncing ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {(!isCollapsed || isMobileOpen) && <span>Cloud Synced</span>}
              </>
            ) : syncState.status === 'syncing' || isManualSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>Syncing Firestore...</span>}
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>Offline Mode</span>}
              </>
            )}
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-[10px] text-neutral-400 hover:underline">Sync</span>
          )}
        </button>

        {/* Action Button Grid */}
        <div className={`grid ${isCollapsed && !isMobileOpen ? 'grid-cols-1' : 'grid-cols-4'} gap-1`}>
          {/* Security Test Suite */}
          <button
            id="security-test-suite-btn"
            onClick={onOpenTesterModal}
            className="p-2 rounded-xl border flex items-center justify-center transition-all bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            title="System Security & Integrity Test Suite"
          >
            <FlaskConical className="w-3.5 h-3.5" />
          </button>

          {/* Dark/Light Mode */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl border flex items-center justify-center transition-colors bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-amber-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Reset DB */}
          <button
            id="reset-db-btn"
            onClick={onOpenResetModal}
            className="p-2 rounded-xl border flex items-center justify-center transition-colors bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Reset Sample Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={logout}
            className="p-2 rounded-xl border flex items-center justify-center transition-colors bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#141414] transition-all duration-300 z-30 ${
          isCollapsed ? 'w-18' : 'w-64 xl:w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Slide-in Drawer */}
          <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-[#141414] border-r border-neutral-200 dark:border-neutral-800 shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
