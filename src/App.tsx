import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginScreen } from './components/LoginScreen';
import { SystemIntegrityTester } from './components/admin/SystemIntegrityTester';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminProduction } from './components/admin/AdminProduction';
import { AdminBranches } from './components/admin/AdminBranches';
import { AdminLogistics } from './components/admin/AdminLogistics';
import { AdminSalesHistory } from './components/admin/AdminSalesHistory';
import { AdminCalendar } from './components/admin/AdminCalendar';
import { AdminAnnouncements } from './components/admin/AdminAnnouncements';

// Branch Views
import { BranchDashboard } from './components/branch/BranchDashboard';
import { BranchSalesPOS } from './components/branch/BranchSalesPOS';
import { BranchOrders } from './components/branch/BranchOrders';
import { BranchInventory } from './components/branch/BranchInventory';
import { BranchLogistics } from './components/branch/BranchLogistics';
import { BranchHistory } from './components/branch/BranchHistory';
import { BranchCalendar } from './components/branch/BranchCalendar';
import { BranchAnnouncements } from './components/branch/BranchAnnouncements';

const MainShell: React.FC = () => {
  const { currentUser, themeMode, resetToDefaultData } = useData();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showTesterModal, setShowTesterModal] = useState<boolean>(false);

  // Reset tab to dashboard on role switch or user change
  useEffect(() => {
    setActiveTab('dashboard');
    setIsMobileOpen(false);
  }, [currentUser?.role, currentUser?.branchId]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      themeMode === 'dark' ? 'bg-[#101010] text-[#f2f2f2]' : 'bg-[#F9FBFC] text-neutral-900'
    }`}>
      {/* Responsive Sidebar (Persistent Desktop & Off-Canvas Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenResetModal={() => setShowConfirmReset(true)}
        onOpenTesterModal={() => setShowTesterModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header with Breadcrumbs & Responsive Controls */}
        <TopHeader
          activeTab={activeTab}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          onOpenResetModal={() => setShowConfirmReset(true)}
          onOpenTesterModal={() => setShowTesterModal(true)}
        />

        {/* View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
          {isAdmin ? (
            <>
              {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
              {activeTab === 'orders' && <AdminOrders />}
              {activeTab === 'production' && <AdminProduction />}
              {activeTab === 'branches' && <AdminBranches />}
              {activeTab === 'logistics' && <AdminLogistics />}
              {activeTab === 'sales' && <AdminSalesHistory />}
              {activeTab === 'calendar' && <AdminCalendar />}
              {activeTab === 'announcements' && <AdminAnnouncements />}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && <BranchDashboard onNavigateTab={setActiveTab} />}
              {activeTab === 'sales_pos' && <BranchSalesPOS />}
              {activeTab === 'orders' && <BranchOrders />}
              {activeTab === 'inventory' && <BranchInventory onNavigateTab={setActiveTab} />}
              {activeTab === 'logistics' && <BranchLogistics />}
              {activeTab === 'history' && <BranchHistory />}
              {activeTab === 'calendar' && <BranchCalendar />}
              {activeTab === 'announcements' && <BranchAnnouncements />}
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
              Commissary: Naga City, Bicol • 19 Nationwide Franchise Branches
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
