import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginScreen } from './components/LoginScreen';
import { SystemIntegrityTester } from './components/admin/SystemIntegrityTester';
import { isSuperAdmin, isBranchManager, isBranchStaff } from './utils/securityValidator';

// Super Admin HQ Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminProduction } from './components/admin/AdminProduction';
import { AdminBranches } from './components/admin/AdminBranches';
import { AdminLogistics } from './components/admin/AdminLogistics';
import { AdminSalesHistory } from './components/admin/AdminSalesHistory';
import { AdminCalendar } from './components/admin/AdminCalendar';
import { AdminAnnouncements } from './components/admin/AdminAnnouncements';
import { AdminUserManagement } from './components/admin/AdminUserManagement';
import { AdminProductPricing } from './components/admin/AdminProductPricing';

// Branch Manager (Store Leadership & Audit) Views
import { ManagerLogValidation } from './components/branch/ManagerLogValidation';
import { ManagerRequisitions } from './components/branch/ManagerRequisitions';
import { ManagerBranchAnalytics } from './components/branch/ManagerBranchAnalytics';
import { ManagerInterBranchTransfers } from './components/branch/ManagerInterBranchTransfers';

// Branch Staff (Frontline Ground Operations) Views
import { StaffPhysicalCounts } from './components/branch/StaffPhysicalCounts';
import { StaffManualSales } from './components/branch/StaffManualSales';
import { StaffWastageLog } from './components/branch/StaffWastageLog';
import { StaffInboundReceiving } from './components/branch/StaffInboundReceiving';

const MainShell: React.FC = () => {
  const { currentUser, themeMode, resetToDefaultData } = useData();
  const [activeTab, setActiveTab] = useState<string>('physical_counts');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showTesterModal, setShowTesterModal] = useState<boolean>(false);

  // Set default initial tab based on the user's role on role switch or initial render
  useEffect(() => {
    if (!currentUser) return;

    if (isBranchStaff(currentUser)) {
      setActiveTab((prev) =>
        ['physical_counts', 'manual_sales', 'spoilage_wastage', 'wastage', 'inbound_receiving', 'receiving'].includes(prev)
          ? prev
          : 'physical_counts'
      );
    } else if (isBranchManager(currentUser)) {
      setActiveTab((prev) =>
        ['log_validation', 'requisitions', 'orders', 'reorder', 'branch_analytics', 'analytics', 'sales', 'transfers', 'inter_branch'].includes(prev)
          ? prev
          : 'log_validation'
      );
    } else if (isSuperAdmin(currentUser)) {
      setActiveTab((prev) =>
        [
          'requisition_approval',
          'orders',
          'network_analytics',
          'dashboard',
          'analytics',
          'user_management',
          'admin_users',
          'rbac',
          'master_pricing',
          'pricing',
          'products',
          'production',
          'branches',
          'logistics',
          'sales',
          'calendar',
          'announcements',
        ].includes(prev)
          ? prev
          : 'requisition_approval'
      );
    }
    setIsMobileOpen(false);
  }, [currentUser?.role, currentUser?.id, currentUser?.branchId]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const isStaff = isBranchStaff(currentUser);
  const isManager = isBranchManager(currentUser);
  const isSuper = isSuperAdmin(currentUser);

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        themeMode === 'dark' ? 'bg-[#101010] text-[#f2f2f2]' : 'bg-[#F9FBFC] text-neutral-900'
      }`}
    >
      {/* Responsive Sidebar (Persistent Desktop & Off-Canvas Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header with Breadcrumbs & Responsive Controls */}
        <TopHeader
          activeTab={activeTab}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          onOpenResetModal={() => setShowConfirmReset(true)}
          onNavigateTab={setActiveTab}
        />

        {/* View Content Enforcing 3-Tier RBAC Route Protection */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
          {/* TIER 1: BRANCH_STAFF (Frontline Ground Operations) */}
          {isStaff && (
            <>
              {activeTab === 'physical_counts' && <StaffPhysicalCounts />}
              {activeTab === 'manual_sales' && <StaffManualSales />}
              {(activeTab === 'spoilage_wastage' || activeTab === 'wastage') && <StaffWastageLog />}
              {(activeTab === 'inbound_receiving' || activeTab === 'receiving') && (
                <StaffInboundReceiving />
              )}
              {/* Fallback route guard: If staff attempts to navigate to any other tab */}
              {!['physical_counts', 'manual_sales', 'spoilage_wastage', 'wastage', 'inbound_receiving', 'receiving'].includes(
                activeTab
              ) && <StaffPhysicalCounts />}
            </>
          )}

          {/* TIER 2: BRANCH_MANAGER (Store Leadership & Validation) */}
          {isManager && (
            <>
              {activeTab === 'log_validation' && <ManagerLogValidation />}
              {(activeTab === 'requisitions' || activeTab === 'orders' || activeTab === 'reorder') && (
                <ManagerRequisitions />
              )}
              {(activeTab === 'branch_analytics' || activeTab === 'analytics' || activeTab === 'sales') && (
                <ManagerBranchAnalytics onNavigateToReorder={() => setActiveTab('requisitions')} />
              )}
              {(activeTab === 'transfers' || activeTab === 'inter_branch') && (
                <ManagerInterBranchTransfers />
              )}
              {/* Fallback route guard: If manager attempts to navigate to any other tab */}
              {![
                'log_validation',
                'requisitions',
                'orders',
                'reorder',
                'branch_analytics',
                'analytics',
                'sales',
                'transfers',
                'inter_branch',
              ].includes(activeTab) && <ManagerLogValidation />}
            </>
          )}

          {/* TIER 3: SUPER_ADMIN (HQ Executive & Commissary Oversight) */}
          {isSuper && (
            <>
              {(activeTab === 'requisition_approval' || activeTab === 'orders') && <AdminOrders />}
              {(activeTab === 'network_analytics' || activeTab === 'analytics' || activeTab === 'dashboard') && (
                <AdminDashboard onNavigateTab={setActiveTab} />
              )}
              {(activeTab === 'user_management' || activeTab === 'admin_users' || activeTab === 'rbac') && (
                <AdminUserManagement />
              )}
              {(activeTab === 'master_pricing' || activeTab === 'pricing' || activeTab === 'products') && (
                <AdminProductPricing />
              )}
              {activeTab === 'production' && <AdminProduction />}
              {activeTab === 'branches' && <AdminBranches />}
              {activeTab === 'logistics' && <AdminLogistics />}
              {activeTab === 'sales' && <AdminSalesHistory />}
              {activeTab === 'calendar' && <AdminCalendar />}
              {activeTab === 'announcements' && <AdminAnnouncements />}
              {/* Fallback route guard */}
              {![
                'requisition_approval',
                'orders',
                'network_analytics',
                'analytics',
                'dashboard',
                'user_management',
                'admin_users',
                'rbac',
                'master_pricing',
                'pricing',
                'products',
                'production',
                'branches',
                'logistics',
                'sales',
                'calendar',
                'announcements',
              ].includes(activeTab) && <AdminOrders />}
            </>
          )}
        </main>

        {/* Modern Compact Footer */}
        <footer className="border-t border-neutral-200/60 dark:border-neutral-800/80 py-5 mt-auto text-center text-xs text-neutral-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong>VertexIS</strong> • Marsh Bites Gourmet Marshmallow Enterprise System
            </p>
            <p className="text-[11px]">
              Commissary: Naga City, Bicol • 19 Nationwide Franchise Branches • 3-Tier RBAC
            </p>
          </div>
        </footer>
      </div>

      {/* Confirm Reset Database Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl border bg-white dark:bg-[#1c1c1c] border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
            <h3 className="text-lg font-bold">Reset to Default Data?</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              This will restore all 19 branches, sample orders, inventory levels, and gourmet marshmallow catalog to default settings and re-seed Firestore.
            </p>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaultData();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Security & Integrity Test Suite Modal */}
      <SystemIntegrityTester
        isOpen={showTesterModal}
        onClose={() => setShowTesterModal(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <DataProvider>
      <MainShell />
    </DataProvider>
  );
}

export default App;
