import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Menu,
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
  Bell,
  Sparkles,
} from 'lucide-react';

interface TopHeaderProps {
  activeTab: string;
  onToggleMobileMenu: () => void;
  onOpenResetModal: () => void;
  onOpenTesterModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onToggleMobileMenu,
  onOpenResetModal,
  onOpenTesterModal,
}) => {
  const {
    currentUser,
    users,
    currentBranch,
    themeMode,
    syncState,
    announcements,
    toggleTheme,
    switchUser,
    logout,
    forceSyncCloud,
  } = useData();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

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

  // Tab metadata titles and icons
  const tabTitles: Record<string, { title: string; subtitle: string; icon: any }> = {
    dashboard: {
      title: 'Executive Overview',
      subtitle: isAdmin ? 'Central Commissary KPI Dashboard' : `${currentBranch?.name || 'Branch'} Daily Operations`,
      icon: LayoutDashboard,
    },
    orders: {
      title: isAdmin ? 'Orders & Commissary Approvals' : 'Stock Requisition Orders',
      subtitle: isAdmin ? 'Review & dispatch branch batch orders' : 'Request fresh marshmallow batches from Bicol',
      icon: ShoppingBag,
    },
    production: {
      title: 'Commissary Batching & Production',
      subtitle: 'Track live kettle whips, curing slabs & dispatch readiness',
      icon: ChefHat,
    },
    branches: {
      title: '19 Nationwide Branches',
      subtitle: 'Centralized franchise performance & stock tracking',
      icon: Building2,
    },
    logistics: {
      title: isAdmin ? 'Fleet & Dispatch Logistics' : 'Inbound Shipments & Receiving',
      subtitle: isAdmin ? 'LBC & cold-chain distribution tracking' : 'Verify physical counts against commissary manifests',
      icon: isAdmin ? Truck : PackageCheck,
    },
    sales: {
      title: 'Sales & BIR Financial Analytics',
      subtitle: 'Official receipts, 12% VAT calculations & Z-Readings',
      icon: TrendingUp,
    },
    sales_pos: {
      title: 'POS Register & Fast Checkout',
      subtitle: 'BIR-compliant receipt generation & multi-tender payment',
      icon: CreditCard,
    },
    inventory: {
      title: 'Branch Stock Ledger & Waste Control',
      subtitle: 'Track physical inventory, restocks & quality adjustments',
      icon: Boxes,
    },
    history: {
      title: 'Sales History & Transaction Audit',
      subtitle: 'View completed receipts, voids, and refunds',
      icon: Receipt,
    },
    calendar: {
      title: 'Operational Schedule & Shifts',
      subtitle: 'Staff schedules, cleaning logs & batch releases',
      icon: Calendar,
    },
    announcements: {
      title: isAdmin ? 'Headquarters Bulletins' : 'Commissary Bulletins',
      subtitle: 'Broadcast alerts and recipe updates across all 19 branches',
      icon: Megaphone,
    },
  };

  const currentTabMeta = tabTitles[activeTab] || {
    title: 'VertexIS System',
    subtitle: 'Marsh Bites Enterprise',
    icon: LayoutDashboard,
  };

  const TabIcon = currentTabMeta.icon;

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md transition-colors shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile Menu Trigger & Active Context Header */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              id="top-mobile-menu-btn"
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Title & Context */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#80C7F2]/15 text-[#0369a1] dark:text-[#80C7F2] items-center justify-center shrink-0 border border-[#80C7F2]/30">
                <TabIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white truncate leading-tight">
                  {currentTabMeta.title}
                </h1>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate hidden sm:block">
                  {currentTabMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Cloud Firestore Status Badge */}
            <button
              id="top-firestore-sync-btn"
              onClick={handleManualSync}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                syncState.status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : syncState.status === 'syncing' || isManualSyncing
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
              }`}
              title="Firestore Cloud Sync Status. Click to force sync."
            >
              {syncState.status === 'connected' && !isManualSyncing ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <CloudCheck className="w-3.5 h-3.5 hidden xs:inline" />
                  <span className="hidden md:inline">Synced</span>
                </>
              ) : syncState.status === 'syncing' || isManualSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden md:inline">Syncing...</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden md:inline">Offline</span>
                </>
              )}
            </button>

            {/* Switch User Dropdown */}
            <div className="relative">
              <button
                id="top-user-switcher-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
                  isAdmin
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                    : 'bg-[#80C7F2]/10 border-[#80C7F2]/30 text-[#1a7bb5] dark:text-[#80C7F2] hover:bg-[#80C7F2]/20'
                }`}
                title="Switch Station / User Role"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Store className="w-3.5 h-3.5 text-[#80C7F2] shrink-0" />
                )}
                <span className="hidden sm:inline truncate max-w-[110px]">
                  {isAdmin ? 'HQ Admin' : currentBranch?.name?.replace('Marsh Bites ', '') || currentUser.name}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl shadow-2xl border z-50 p-2 text-xs bg-white dark:bg-[#1c1c1c] border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
                    <div className="px-2.5 py-1.5 border-b border-neutral-200 dark:border-neutral-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Switch Station / Account
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
                            {isSelected && <UserCheck className="w-3.5 h-3.5 text-[#80C7F2]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                id="top-notifications-btn"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className={`relative p-2 rounded-xl border transition-colors ${
                  showNotificationMenu
                    ? 'bg-[#80C7F2]/20 border-[#80C7F2]/40 text-[#1a7bb5] dark:text-[#80C7F2]'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title="System Notifications & Workflow Alerts"
              >
                <Bell className="w-3.5 h-3.5" />
                {announcements.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#F37021] text-[9px] font-black text-white shadow-xs">
                    {announcements.length > 9 ? '9+' : announcements.length}
                  </span>
                )}
              </button>

              {showNotificationMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-2xl shadow-2xl border z-50 p-3 text-xs bg-white dark:bg-[#1c1c1c] border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center space-x-1.5 font-bold text-xs">
                        <Bell className="w-3.5 h-3.5 text-[#F37021]" />
                        <span>Live Broadcasts & Workflow Handoffs</span>
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        {announcements.length} alerts
                      </span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {announcements.length === 0 ? (
                        <div className="py-6 text-center text-neutral-400">
                          <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                          <p className="text-xs">No active alerts</p>
                        </div>
                      ) : (
                        announcements.slice(0, 10).map((ann) => {
                          const isDispatch = ann.title.includes('Dispatched') || ann.title.includes('🚚');
                          const isDelivered = ann.title.includes('Delivered') || ann.title.includes('Confirmed') || ann.title.includes('✅');
                          const isReady = ann.title.includes('Ready') || ann.title.includes('📦');

                          let badgeColor = 'bg-[#80C7F2]/15 text-[#1a7bb5] dark:text-[#80C7F2] border-[#80C7F2]/30';
                          if (isDelivered) {
                            badgeColor = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                          } else if (isDispatch) {
                            badgeColor = 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
                          } else if (isReady) {
                            badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
                          }

                          return (
                            <div
                              key={ann.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50/80 border-neutral-200/80'
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                <span className={`p-1 rounded-md border shrink-0 mt-0.5 ${badgeColor}`}>
                                  <Sparkles className="w-3 h-3" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs leading-snug text-neutral-900 dark:text-neutral-100">
                                    {ann.title}
                                  </p>
                                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed line-clamp-3">
                                    {ann.message}
                                  </p>
                                  <p className="text-[9.5px] text-neutral-400 mt-1 font-mono">
                                    {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Diagnostic Security Test Suite */}
            <button
              id="top-security-tests-btn"
              onClick={onOpenTesterModal}
              className="p-2 rounded-xl border transition-colors bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              title="Open System Security & Integrity Test Suite"
            >
              <FlaskConical className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              id="top-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-xl border transition-colors bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-amber-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Reset Database */}
            <button
              id="top-reset-db-btn"
              onClick={onOpenResetModal}
              className="p-2 rounded-xl border transition-colors bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hidden sm:flex"
              title="Reset Sample Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Logout */}
            <button
              id="top-logout-btn"
              onClick={logout}
              className="p-2 rounded-xl border transition-colors bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
