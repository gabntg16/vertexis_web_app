import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserModel,
  Branch,
  Product,
  Order,
  Delivery,
  Receiving,
  InventoryItem,
  Sale,
  Announcement,
  CalendarEvent,
  RestockSuggestion,
  OrderStatus,
  DeliveryStatus,
  ReceivingStatus,
  CalendarEventType,
  ProductionStage,
  BatchStage,
  ProductionBatch,
  BranchStatus,
  BranchBusinessType,
  BranchApplication,
  BranchDocument,
  BranchAccount,
  BranchAccountRole,
  BranchStatusHistory,
  BranchAuditLog,
  ApplicationStatus,
  DocumentVerificationStatus,
  DocumentType,
  BIRReceipt,
  ShiftClosingRecord,
  InventoryMovementRecord,
  POSAuditLog,
  POSPaymentDetail,
  POSSeniorPwdDetail,
  POSTransactionItem,
  CashDenominationCount,
  POSPaymentMethod,
} from '../types';
import { firestoreSync, SyncState } from '../services/firestoreSync';
import {
  INITIAL_ENHANCED_BRANCHES,
  INITIAL_BRANCH_APPLICATIONS,
  INITIAL_BRANCH_ACCOUNTS,
  INITIAL_BRANCH_STATUS_HISTORY,
  INITIAL_BRANCH_AUDIT_LOGS,
} from '../data/initialBranchData';
import {
  generateInitialBIRReceipts,
  generateInitialShiftClosings,
  generateInitialInventoryMovements,
  generateInitialPOSAuditLogs,
} from '../data/initialPOSData';

const INITIAL_BRANCHES: Branch[] = INITIAL_ENHANCED_BRANCHES;

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Gourmet Marshmallow', flavor: 'Oreo Cookies', price: 149, wholesalePrice: 100, adminStock: 450 },
  { id: 'p2', name: 'Gourmet Marshmallow', flavor: 'Dried Mango & Mango Flavor', price: 149, wholesalePrice: 100, adminStock: 380 },
  { id: 'p3', name: 'Gourmet Marshmallow', flavor: 'Caramel Macchiato & Biscoff', price: 149, wholesalePrice: 100, adminStock: 520 },
  { id: 'p4', name: 'Gourmet Marshmallow', flavor: 'Strawberry & Cheesecake Flavor', price: 149, wholesalePrice: 100, adminStock: 410 },
  { id: 'p5', name: 'Gourmet Marshmallow', flavor: 'Ube Jam & Flavor', price: 149, wholesalePrice: 100, adminStock: 600 },
  { id: 'p6', name: 'Gourmet Marshmallow', flavor: 'Matcha Powder', price: 149, wholesalePrice: 100, adminStock: 320 },
  { id: 'p7', name: 'Gourmet Marshmallow', flavor: 'Blueberry Powder & Sour Strips', price: 149, wholesalePrice: 100, adminStock: 290 },
];

function generateInitialUsers(): UserModel[] {
  const users: UserModel[] = [
    {
      id: 'u0',
      name: 'Super Admin (Headquarters)',
      email: 'admin@marshbites.com',
      password: 'admin123',
      role: 'admin',
    },
  ];

  INITIAL_BRANCHES.forEach((b) => {
    const slug = b.id.replace('b-', '');
    users.push({
      id: `u-${b.id}`,
      name: `${b.name} Manager`,
      email: `${slug}@marshbites.com`,
      password: 'branch123',
      role: 'branch',
      branchId: b.id,
    });
  });

  return users;
}

function generateInitialInventory(): InventoryItem[] {
  const inv: InventoryItem[] = [];
  INITIAL_BRANCHES.forEach((b) => {
    INITIAL_PRODUCTS.forEach((p, idx) => {
      const initialStock = [18, 12, 5, 24, 8, 15, 6][idx % 7];
      inv.push({
        id: `inv-${b.id}-${p.id}`,
        branchId: b.id,
        productId: p.id,
        productName: `${p.flavor} (${p.name})`,
        stock: initialStock,
      });
    });
  });
  return inv;
}

function generateInitialSales(): Sale[] {
  const sales: Sale[] = [];
  const now = new Date();

  INITIAL_BRANCHES.forEach((b) => {
    for (let dayOffset = 10; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(now.getDate() - dayOffset);
      date.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      const numTransactions = b.id === 'b-legazpi' || b.id === 'b-cabuyao' || b.id === 'b-makati' ? 4 : 2;
      for (let t = 0; t < numTransactions; t++) {
        const prod = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        sales.push({
          id: `sale-${b.id}-${dayOffset}-${t}`,
          branchId: b.id,
          productId: prod.id,
          productName: `${prod.flavor} (${prod.name})`,
          quantity: qty,
          total: qty * prod.price,
          date: date.toISOString(),
          receiptPath: `REC-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }
    }
  });

  return sales;
}

function generateInitialOrders(): Order[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const d2 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date().toISOString();

  return [
    {
      id: 'ord-1001',
      branchId: 'b-legazpi',
      branchName: 'Marsh Bites Legazpi',
      status: 'approved',
      productionStage: 'packaged',
      batchCode: 'MTO-LEG-0818',
      estimatedReadyDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: 100 * 40,
      createdAt: d1,
      items: [
        { productId: 'p1', productName: 'Oreo Cookies (Gourmet Marshmallow)', quantity: 20, unitPrice: 100 },
        { productId: 'p5', productName: 'Ube Jam & Flavor (Gourmet Marshmallow)', quantity: 20, unitPrice: 100 },
      ],
      proofImagePath: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'ord-1002',
      branchId: 'b-cabuyao',
      branchName: 'Marsh Bites Cabuyao',
      status: 'waitingApproval',
      productionStage: 'in_kettle',
      batchCode: 'MTO-CAB-0819',
      estimatedReadyDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: 100 * 30,
      createdAt: d2,
      items: [
        { productId: 'p3', productName: 'Caramel Macchiato & Biscoff (Gourmet Marshmallow)', quantity: 15, unitPrice: 100 },
        { productId: 'p4', productName: 'Strawberry & Cheesecake (Gourmet Marshmallow)', quantity: 15, unitPrice: 100 },
      ],
      proofImagePath: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'ord-1003',
      branchId: 'b-makati',
      branchName: 'Marsh Bites Makati',
      status: 'pending',
      productionStage: 'queued',
      batchCode: 'MTO-MAK-0820',
      totalAmount: 100 * 25,
      createdAt: d3,
      items: [
        { productId: 'p2', productName: 'Dried Mango & Mango Flavor (Gourmet Marshmallow)', quantity: 25, unitPrice: 100 },
      ],
    },
  ];
}

function generateInitialProductionBatches(): ProductionBatch[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const d2 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'batch-mto-101',
      batchCode: 'MTO-LEG-0818-A',
      productId: 'p1',
      productFlavor: 'Oreo Cookies',
      quantity: 20,
      targetOrderId: 'ord-1001',
      targetBranchName: 'Marsh Bites Legazpi',
      stage: 'completed',
      chefName: 'Chef Dante (Head Confectioner)',
      startedAt: d1,
      completedAt: d2,
      notes: 'Made-to-order batch for Legazpi franchise requisition',
    },
    {
      id: 'batch-mto-102',
      batchCode: 'MTO-LEG-0818-B',
      productId: 'p5',
      productFlavor: 'Ube Jam & Flavor',
      quantity: 20,
      targetOrderId: 'ord-1001',
      targetBranchName: 'Marsh Bites Legazpi',
      stage: 'completed',
      chefName: 'Chef Maria (Bicol Fluff Artisan)',
      startedAt: d1,
      completedAt: d2,
      notes: 'Real Bicol Ube Halaya swirl made-to-order batch',
    },
    {
      id: 'batch-mto-103',
      batchCode: 'MTO-CAB-0819-A',
      productId: 'p3',
      productFlavor: 'Caramel Macchiato & Biscoff',
      quantity: 15,
      targetOrderId: 'ord-1002',
      targetBranchName: 'Marsh Bites Cabuyao',
      stage: 'curing',
      chefName: 'Chef Dante (Head Confectioner)',
      startedAt: d2,
      notes: 'Curing on slab table #2. 12-hour resting phase.',
    },
    {
      id: 'batch-mto-104',
      batchCode: 'MTO-CAB-0819-B',
      productId: 'p4',
      productFlavor: 'Strawberry & Cheesecake',
      quantity: 15,
      targetOrderId: 'ord-1002',
      targetBranchName: 'Marsh Bites Cabuyao',
      stage: 'in_kettle',
      chefName: 'Chef Maria (Bicol Fluff Artisan)',
      startedAt: d3,
      notes: 'In marshmallow whip kettle. Gelatin & strawberry puree bloom boiling.',
    },
  ];
}

function generateInitialDeliveries(): Delivery[] {
  const now = new Date();
  return [
    {
      id: 'del-101',
      orderId: 'ord-1001',
      branchId: 'b-legazpi',
      address: 'Marsh Bites Legazpi, Rizal St., Legazpi City, Albay',
      status: 'inTransit',
      scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      courierName: 'LBC Express Cargo',
      trackingNumber: 'LBC-PH-98421092',
      notes: 'Cold pack insulated dispatch for gourmet marshmallows',
    },
  ];
}

function generateInitialReceivings(): Receiving[] {
  const now = new Date();
  return [
    {
      id: 'rec-101',
      deliveryId: 'del-101',
      orderId: 'ord-1001',
      branchId: 'b-legazpi',
      status: 'pending',
      createdAt: now.toISOString(),
      receiverName: 'Legazpi Store Supervisor',
      conditionNotes: 'Pending transit arrival',
    },
  ];
}

function generateInitialAnnouncements(): Announcement[] {
  const now = new Date();
  return [
    {
      id: 'ann-1',
      title: 'Handmade in Bicol — Premium Batch Update',
      message: 'Welcome to the official Marsh Bites Centralized Branch System. All gourmet marshmallow stock is freshly handcrafted in Bicol using natural flavors and artisanal marshmallow fluff.',
      createdAt: now.toISOString(),
    },
    {
      id: 'ann-2',
      title: 'Predictive Demand & Automated Safety Buffers',
      message: 'Branches can now consult the automated Restock Suggestion module based on a 14-day rolling demand curve to eliminate stockouts during high-traffic weekend periods.',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateInitialEvents(): CalendarEvent[] {
  const now = new Date();
  const d1 = new Date(now);
  d1.setDate(now.getDate() + 2);
  const d2 = new Date(now);
  d2.setDate(now.getDate() + 5);

  return [
    {
      id: 'evt-1',
      title: 'Batch Production Run: Ube Jam & Biscoff Flavors',
      date: d1.toISOString().split('T')[0],
      description: 'Handcraft 1,200 fresh gourmet units at Central Bicol Commissary.',
      type: 'task',
    },
    {
      id: 'evt-2',
      title: 'Quarterly Franchise Alignment & Inventory Audit',
      date: d2.toISOString().split('T')[0],
      description: 'Branch managers review demand trends and seasonal specials.',
      type: 'appointment',
      branchId: 'b-legazpi',
      branchName: 'Marsh Bites Legazpi',
    },
  ];
}

interface DataContextType {
  users: UserModel[];
  branches: Branch[];
  products: Product[];
  orders: Order[];
  deliveries: Delivery[];
  receivings: Receiving[];
  inventory: InventoryItem[];
  sales: Sale[];
  announcements: Announcement[];
  events: CalendarEvent[];
  productionBatches: ProductionBatch[];
  // Branch Management Extensions
  branchApplications: BranchApplication[];
  branchDocuments: BranchDocument[];
  branchAccounts: BranchAccount[];
  branchStatusHistory: BranchStatusHistory[];
  branchAuditLogs: BranchAuditLog[];
  branchStatusCounts: {
    total: number;
    active: number;
    pendingActivation: number;
    pendingApplications: number;
    suspended: number;
    closed: number;
    inactive: number;
  };
  currentUser: UserModel | null;
  themeMode: 'light' | 'dark';
  currentBranch: Branch | null;
  syncState: SyncState;
  toggleTheme: () => void;
  login: (email: string, pass: string) => UserModel | null;
  logout: () => void;
  switchUser: (userId: string) => void;
  addBranch: (name: string, location: string, businessType?: string, contactNumber?: string, email?: string, operatingHours?: string, managerName?: string, managerPhone?: string, managerEmail?: string, managerGovId?: string) => Branch;
  submitBranchApplication: (data: {
    branchName: string;
    businessType: BranchBusinessType | string;
    address: string;
    contactNumber: string;
    email: string;
    operatingHours: string;
    managerName: string;
    managerPhone: string;
    managerEmail: string;
    managerGovId: string;
    documents?: BranchDocument[];
  }) => BranchApplication;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, notes?: string, remarks?: string) => void;
  verifyDocument: (docId: string, status: DocumentVerificationStatus, remarks?: string) => void;
  approveBranchApplication: (applicationId: string) => { branch: Branch; managerAccount: BranchAccount; staffAccount: BranchAccount } | null;
  rejectBranchApplication: (applicationId: string, reason: string) => void;
  requestDocumentResubmission: (applicationId: string, docId: string, reason: string) => void;
  uploadDocument: (doc: Omit<BranchDocument, 'id' | 'status' | 'uploadedAt'> & { status?: DocumentVerificationStatus }) => BranchDocument;
  setBranchStatus: (branchId: string, newStatus: BranchStatus, reason: string) => void;
  activateBranch: (branchId: string, reason?: string) => void;
  suspendBranch: (branchId: string, reason: string) => void;
  reopenBranch: (branchId: string, reason?: string) => void;
  archiveBranch: (branchId: string, reason?: string) => void;
  softDeleteBranch: (branchId: string, reason: string) => void;
  checkPermanentDeletionEligibility: (branchId: string) => {
    eligible: boolean;
    reasons: string[];
    pendingOrders: number;
    unresolvedDiscrepancies: number;
    unpaidBalances: number;
  };
  permanentDeleteBranch: (branchId: string, auditRemarks: string) => { success: boolean; backupSnapshot: any; message?: string };
  createBranchAccount: (payload: {
    branchId: string;
    fullName: string;
    email: string;
    role: BranchAccountRole;
    phone?: string;
    permissions?: string[];
  }) => BranchAccount;
  updateBranchAccount: (account: BranchAccount) => void;
  resetBranchAccountPassword: (accountId: string) => { temporaryPassword: string };
  toggleBranchAccountActive: (accountId: string, isActive: boolean) => void;
  sendAccountCredentials: (accountId: string) => boolean;
  logBranchAudit: (action: string, remarks: string, branchId?: string, branchName?: string, metadata?: Record<string, any>) => BranchAuditLog;
  getApplicationDocuments: (appId: string) => BranchDocument[];
  getBranchDocuments: (branchId: string) => BranchDocument[];
  getBranchAccounts: (branchId: string) => BranchAccount[];
  getBranchStatusHistory: (branchId: string) => BranchStatusHistory[];
  getBranchAuditLogs: (branchId?: string) => BranchAuditLog[];
  addProduct: (name: string, flavor: string, price: number, adminStock: number, wholesalePrice?: number) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  logProduction: (productId: string, quantity: number) => void;
  logProductionBatch: (payload: {
    productId: string;
    quantity: number;
    targetOrderId?: string;
    targetBranchName?: string;
    chefName?: string;
    stage?: BatchStage;
    notes?: string;
  }) => ProductionBatch;
  updateBatchStage: (batchId: string, stage: BatchStage) => void;
  updateOrderProductionStage: (orderId: string, stage: ProductionStage, batchCode?: string) => void;
  produceForOrder: (orderId: string, chefName?: string) => void;
  addProductionStock: (branchId: string, productId: string, quantity: number) => void;
  createOrder: (
    items: { productId: string; productName: string; quantity: number; unitPrice: number }[],
    customTotal?: number,
    packageName?: string,
    packageTier?: 'silver' | 'gold' | 'platinum'
  ) => Order | null;
  uploadPaymentProof: (
    orderId: string,
    proofUrl: string,
    paymentDetails?: {
      paymentMethod?: DigitalPaymentMethod | string;
      paymentIntentId?: string;
      referenceNumber?: string;
      status?: PaymentGatewayStatus;
    }
  ) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  deleteOrder: (orderId: string) => void;
  archiveOrder: (orderId: string) => void;
  createDelivery: (
    orderId: string,
    address: string,
    courierName?: string,
    trackingNumber?: string,
    scheduledAt?: string,
    notes?: string,
    extra?: {
      dispatchMethod?: DispatchMethod;
      waybillNumber?: string;
      jtSortingCode?: string;
      driverName?: string;
      vehiclePlateNo?: string;
      receiverContact?: string;
      receiverPhone?: string;
      weightKg?: number;
    }
  ) => Delivery;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryStatus, deliveredAt?: string) => void;
  cancelDelivery: (deliveryId: string, reason?: string) => void;
  createReceiving: (deliveryId: string, receiverName?: string, conditionNotes?: string, notes?: string) => Receiving;
  updateReceivingStatus: (receivingId: string, status: ReceivingStatus, conditionNotes?: string, receiverName?: string) => void;
  createReceivingInspection: (deliveryId: string, orderId: string, status: ReceivingStatus, receiverName: string, conditionNotes: string) => void;
  updateStock: (inventoryId: string, newStock: number) => void;
  recordSale: (productId: string, quantity: number, customTotal?: number, date?: string, receiptPath?: string) => void;
  recordMultiItemSale: (payload: {
    items: { productId: string; quantity: number; unitPrice: number }[];
    paymentMethod: 'Cash' | 'GCash' | 'Maya' | 'Card' | string;
    amountTendered?: number;
    change?: number;
    discountAmount?: number;
    discountType?: string;
    customerName?: string;
    receiptNumber?: string;
    source?: string;
  }) => { receiptNumber: string; totalAmount: number; itemsCount: number };
  importBatchSales: (imported: Array<{
    flavor: string;
    quantity: number;
    total: number;
    date?: string;
    paymentMethod?: string;
    receipt?: string;
  }>) => { successCount: number; errors: string[] };
  addAnnouncement: (title: string, message: string) => void;
  deleteAnnouncement: (id: string) => void;
  addEvent: (title: string, date: string, description: string, type: CalendarEventType, branchId?: string, branchName?: string) => void;
  deleteEvent: (id: string) => void;
  resetToDefaultData: () => void;
  forceSyncCloud: () => Promise<void>;
  // BIR-Compliant POS Engine
  birReceipts: BIRReceipt[];
  shiftClosings: ShiftClosingRecord[];
  inventoryMovements: InventoryMovementRecord[];
  posAuditLogs: POSAuditLog[];
  registerShift: {
    isOpened: boolean;
    openedAt?: string;
    cashierName?: string;
    openingFloat: number;
    terminalId: string;
  };
  openRegisterShift: (cashierName: string, openingFloat: number, terminalId?: string) => void;
  processPOSTransaction: (payload: {
    items: { productId: string; quantity: number; unitPrice?: number }[];
    payments: POSPaymentDetail[];
    discountType: 'none' | 'pwd_senior' | 'promo10' | 'promo15' | 'custom';
    customDiscountAmount?: number;
    seniorPwdDetail?: POSSeniorPwdDetail;
    terminalId?: string;
    cashierName?: string;
    amountTendered?: number;
    customerName?: string;
  }) => { receipt: BIRReceipt; change: number };
  voidPOSTransaction: (
    receiptId: string,
    managerPin: string,
    managerName: string,
    voidReason: string
  ) => { success: boolean; message?: string; receipt?: BIRReceipt };
  refundPOSTransaction: (
    receiptId: string,
    managerPin: string,
    managerName: string,
    refundReason: string,
    refundMethod: POSPaymentMethod,
    restockInventory: boolean,
    itemProductIds?: string[]
  ) => { success: boolean; message?: string; refundAmount?: number };
  closeShiftAndGenerateZReading: (payload: {
    cashierName: string;
    managerApprovedBy: string;
    actualCash: number;
    cashBreakdown?: CashDenominationCount[];
    notes?: string;
  }) => ShiftClosingRecord;
  getXReadingSummary: (branchId?: string) => {
    grossSales: number;
    netSales: number;
    vatableSales: number;
    vatAmount: number;
    vatExemptSales: number;
    zeroRatedSales: number;
    totalDiscounts: number;
    cashSales: number;
    digitalSales: number;
    cardSales: number;
    bankTransferSales: number;
    transactionsCount: number;
    voidsCount: number;
    voidAmount: number;
    refundsCount: number;
    refundAmount: number;
    beginningReceiptNo: string;
    endingReceiptNo: string;
    openingFloat: number;
    expectedCash: number;
  };
  logPOSAudit: (
    action: POSAuditLog['action'],
    details: string,
    referenceId?: string,
    branchId?: string
  ) => POSAuditLog;
  getReceiptsForBranch: (branchId: string) => BIRReceipt[];
  getZReadingsForBranch: (branchId: string) => ShiftClosingRecord[];
  getInventoryMovementsForBranch: (branchId: string) => InventoryMovementRecord[];
  getPOSAuditLogsForBranch: (branchId: string) => POSAuditLog[];
  // Helpers / Analytics
  getBranch: (id: string) => Branch | undefined;
  getSalesForBranch: (branchId: string) => Sale[];
  getOrdersForBranch: (branchId: string) => Order[];
  getInventoryForBranch: (branchId: string) => InventoryItem[];
  branchRevenue: (branchId: string) => number;
  branchStockCount: (branchId: string) => number;
  restockSuggestionsForBranch: (branchId: string) => RestockSuggestion[];
  demandForecastForBranch: (branchId: string) => string;
  weeklyDemandAmountForBranch: (branchId: string) => number;
  adminRestockInsights: { branchName: string; productName: string; suggested: number; urgency: string }[];
  madeToOrderDemand: {
    productId: string;
    flavor: string;
    unitPrice: number;
    requestedUnits: number;
    inProductionUnits: number;
    readyBufferUnits: number;
    pendingOrderIds: string[];
    affectedBranchCount: number;
  }[];
  totalRevenue: number;
  pendingOrdersCount: number;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'vertexis_marshbites_data_v1';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserModel[]>(() => generateInitialUsers());
  const [branches, setBranches] = useState<Branch[]>(() => INITIAL_BRANCHES);
  const [products, setProducts] = useState<Product[]>(() => INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(() => generateInitialOrders());
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => generateInitialDeliveries());
  const [receivings, setReceivings] = useState<Receiving[]>(() => generateInitialReceivings());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => generateInitialInventory());
  const [sales, setSales] = useState<Sale[]>(() => generateInitialSales());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => generateInitialAnnouncements());
  const [events, setEvents] = useState<CalendarEvent[]>(() => generateInitialEvents());
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(() => generateInitialProductionBatches());
  // Branch Management State
  const [branchApplications, setBranchApplications] = useState<BranchApplication[]>(() => INITIAL_BRANCH_APPLICATIONS);
  const [branchDocuments, setBranchDocuments] = useState<BranchDocument[]>(() => {
    const allDocs: BranchDocument[] = [];
    INITIAL_BRANCH_APPLICATIONS.forEach((app) => {
      if (app.documents) allDocs.push(...app.documents);
    });
    return allDocs;
  });
  const [branchAccounts, setBranchAccounts] = useState<BranchAccount[]>(() => INITIAL_BRANCH_ACCOUNTS);
  const [branchStatusHistory, setBranchStatusHistory] = useState<BranchStatusHistory[]>(() => INITIAL_BRANCH_STATUS_HISTORY);
  const [branchAuditLogs, setBranchAuditLogs] = useState<BranchAuditLog[]>(() => INITIAL_BRANCH_AUDIT_LOGS);

  // BIR-Compliant Point of Sale State
  const [birReceipts, setBirReceipts] = useState<BIRReceipt[]>(() => generateInitialBIRReceipts(INITIAL_BRANCHES, INITIAL_PRODUCTS));
  const [shiftClosings, setShiftClosings] = useState<ShiftClosingRecord[]>(() => generateInitialShiftClosings(INITIAL_BRANCHES));
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovementRecord[]>(() => generateInitialInventoryMovements(INITIAL_BRANCHES, INITIAL_PRODUCTS));
  const [posAuditLogs, setPosAuditLogs] = useState<POSAuditLog[]>(() => generateInitialPOSAuditLogs(INITIAL_BRANCHES));
  const [registerShift, setRegisterShift] = useState<{
    isOpened: boolean;
    openedAt?: string;
    cashierName?: string;
    openingFloat: number;
    terminalId: string;
  }>({
    isOpened: true,
    openedAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    cashierName: 'Duty Cashier',
    openingFloat: 2000,
    terminalId: 'POS-01',
  });

  const [currentUser, setCurrentUser] = useState<UserModel | null>(() => users[0]);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [syncState, setSyncState] = useState<SyncState>({ status: 'syncing', lastSyncedAt: null });

  // 1. Listen for Firestore sync state changes
  useEffect(() => {
    const unsub = firestoreSync.onSyncStateChange((s) => setSyncState(s));
    return unsub;
  }, []);

  // 2. Load LocalStorage as initial cache & subscribe to Firestore real-time updates
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.branches) setBranches(parsed.branches);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.deliveries) setDeliveries(parsed.deliveries);
        if (parsed.receivings) setReceivings(parsed.receivings);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.announcements) setAnnouncements(parsed.announcements);
        if (parsed.events) setEvents(parsed.events);
        if (parsed.productionBatches) setProductionBatches(parsed.productionBatches);
        if (parsed.branchApplications) setBranchApplications(parsed.branchApplications);
        if (parsed.branchDocuments) setBranchDocuments(parsed.branchDocuments);
        if (parsed.branchAccounts) setBranchAccounts(parsed.branchAccounts);
        if (parsed.branchStatusHistory) setBranchStatusHistory(parsed.branchStatusHistory);
        if (parsed.branchAuditLogs) setBranchAuditLogs(parsed.branchAuditLogs);
        if (parsed.birReceipts) setBirReceipts(parsed.birReceipts);
        if (parsed.shiftClosings) setShiftClosings(parsed.shiftClosings);
        if (parsed.inventoryMovements) setInventoryMovements(parsed.inventoryMovements);
        if (parsed.posAuditLogs) setPosAuditLogs(parsed.posAuditLogs);
        if (parsed.registerShift) setRegisterShift(parsed.registerShift);
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.currentUserId) {
          const u = parsed.users?.find((x: UserModel) => x.id === parsed.currentUserId);
          if (u) setCurrentUser(u);
        }
      }
    } catch (e) {
      console.warn('Could not parse localStorage data', e);
    }

    // Subscribe to Firestore collections
    const unsubFirestore = firestoreSync.subscribeAll({
      onBranches: (b) => { if (b.length > 0) setBranches(b); },
      onUsers: (u) => { if (u.length > 0) setUsers(u); },
      onProducts: (p) => { if (p.length > 0) setProducts(p); },
      onOrders: (o) => setOrders(o),
      onDeliveries: (d) => setDeliveries(d),
      onReceivings: (r) => setReceivings(r),
      onInventory: (i) => { if (i.length > 0) setInventory(i); },
      onSales: (s) => setSales(s),
      onAnnouncements: (a) => { if (a.length > 0) setAnnouncements(a); },
      onEvents: (e) => { if (e.length > 0) setEvents(e); },
      onProductionBatches: (pb) => { if (pb.length > 0) setProductionBatches(pb); },
      onBranchApplications: (ba) => { if (ba.length > 0) setBranchApplications(ba); },
      onBranchDocuments: (bd) => { if (bd.length > 0) setBranchDocuments(bd); },
      onBranchAccounts: (bac) => { if (bac.length > 0) setBranchAccounts(bac); },
      onBranchStatusHistory: (bsh) => { if (bsh.length > 0) setBranchStatusHistory(bsh); },
      onBranchAuditLogs: (bal) => { if (bal.length > 0) setBranchAuditLogs(bal); },
      onBirReceipts: (rec) => { if (rec.length > 0) setBirReceipts(rec); },
      onInventoryMovements: (mov) => { if (mov.length > 0) setInventoryMovements(mov); },
      onPosAuditLogs: (logs) => { if (logs.length > 0) setPosAuditLogs(logs); },
      onShiftClosings: (sc) => { if (sc.length > 0) setShiftClosings(sc); },
    });

    // Seed database if empty
    firestoreSync.seedInitialDatasetIfEmpty({
      users: generateInitialUsers(),
      branches: INITIAL_BRANCHES,
      products: INITIAL_PRODUCTS,
      orders: generateInitialOrders(),
      deliveries: generateInitialDeliveries(),
      receivings: generateInitialReceivings(),
      inventory: generateInitialInventory(),
      sales: generateInitialSales(),
      announcements: generateInitialAnnouncements(),
      events: generateInitialEvents(),
      productionBatches: generateInitialProductionBatches(),
      branchApplications: INITIAL_BRANCH_APPLICATIONS,
      branchAccounts: INITIAL_BRANCH_ACCOUNTS,
      branchStatusHistory: INITIAL_BRANCH_STATUS_HISTORY,
      branchAuditLogs: INITIAL_BRANCH_AUDIT_LOGS,
    });

    return () => {
      unsubFirestore();
    };
  }, []);

  // 3. Cache to LocalStorage on state change
  useEffect(() => {
    try {
      const stateToSave = {
        users,
        branches,
        products,
        orders,
        deliveries,
        receivings,
        inventory,
        sales,
        announcements,
        events,
        productionBatches,
        branchApplications,
        branchDocuments,
        branchAccounts,
        branchStatusHistory,
        branchAuditLogs,
        birReceipts,
        shiftClosings,
        inventoryMovements,
        posAuditLogs,
        registerShift,
        themeMode,
        currentUserId: currentUser?.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not persist to localStorage', e);
    }
  }, [
    users,
    branches,
    products,
    orders,
    deliveries,
    receivings,
    inventory,
    sales,
    announcements,
    events,
    productionBatches,
    branchApplications,
    branchDocuments,
    branchAccounts,
    branchStatusHistory,
    branchAuditLogs,
    birReceipts,
    shiftClosings,
    inventoryMovements,
    posAuditLogs,
    registerShift,
    themeMode,
    currentUser,
  ]);

  // Sync theme to DOM
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = (email: string, pass: string): UserModel | null => {
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === pass
    );
    if (found) {
      setCurrentUser(found);
      return found;
    }
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (u) {
      setCurrentUser(u);
    }
  };

  const currentBranch = useMemo(() => {
    if (!currentUser || !currentUser.branchId) return null;
    return branches.find((b) => b.id === currentUser.branchId) || null;
  }, [currentUser, branches]);

  const getBranch = (id: string) => branches.find((b) => b.id === id);

  const branchStatusCounts = useMemo(() => {
    let active = 0;
    let pendingActivation = 0;
    let suspended = 0;
    let closed = 0;
    let inactive = 0;

    branches.forEach((b) => {
      const s = b.status || 'Active';
      if (s === 'Active') active++;
      else if (s === 'Pending Activation') pendingActivation++;
      else if (s === 'Suspended') suspended++;
      else if (s === 'Closed') closed++;
      else if (s === 'Inactive') inactive++;
    });

    const pendingApplications = branchApplications.filter(
      (a) => a.status === 'Pending Review' || a.status === 'Under Verification' || a.status === 'Requires Revision'
    ).length;

    return {
      total: branches.length,
      active,
      pendingActivation,
      pendingApplications,
      suspended,
      closed,
      inactive,
    };
  }, [branches, branchApplications]);

  const logBranchAudit = useCallback(
    (action: string, remarks: string, branchId?: string, branchName?: string, metadata?: Record<string, any>): BranchAuditLog => {
      const newLog: BranchAuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        branchId,
        branchName,
        action,
        user: currentUser ? `${currentUser.name} (${currentUser.role === 'admin' ? 'HQ Admin' : 'Branch'})` : 'System Operator',
        timestamp: new Date().toISOString(),
        remarks,
        metadata,
      };
      setBranchAuditLogs((prev) => [newLog, ...prev]);
      firestoreSync.saveDoc('branch_audit_logs', newLog.id, newLog);
      return newLog;
    },
    [currentUser]
  );

  const uploadDocument = useCallback(
    (docPayload: Omit<BranchDocument, 'id' | 'status' | 'uploadedAt'> & { status?: DocumentVerificationStatus }): BranchDocument => {
      const newDoc: BranchDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        status: docPayload.status || 'pending',
        uploadedAt: new Date().toISOString(),
        ...docPayload,
      };

      setBranchDocuments((prev) => [newDoc, ...prev]);
      firestoreSync.saveDoc('branch_documents', newDoc.id, newDoc);

      if (docPayload.applicationId) {
        setBranchApplications((prev) =>
          prev.map((app) => {
            if (app.id === docPayload.applicationId) {
              const updatedDocs = [...(app.documents || []).filter((d) => d.id !== newDoc.id), newDoc];
              const updatedApp = { ...app, documents: updatedDocs, updatedAt: new Date().toISOString() };
              firestoreSync.saveDoc('branch_applications', updatedApp.id, updatedApp);
              return updatedApp;
            }
            return app;
          })
        );
      }

      logBranchAudit(
        'Documents Uploaded',
        `Uploaded compliance document "${newDoc.title}" (${newDoc.fileName}) for ${docPayload.applicationId || docPayload.branchId || 'Franchise Application'}`,
        docPayload.branchId || docPayload.applicationId,
        docPayload.title
      );

      return newDoc;
    },
    [logBranchAudit]
  );

  const submitBranchApplication = useCallback(
    (data: {
      branchName: string;
      businessType: BranchBusinessType | string;
      address: string;
      contactNumber: string;
      email: string;
      operatingHours: string;
      managerName: string;
      managerPhone: string;
      managerEmail: string;
      managerGovId: string;
      documents?: BranchDocument[];
    }): BranchApplication => {
      const citySlug = (data.address.split(',')[0] || data.branchName)
        .replace(/Marsh Bites/gi, '')
        .trim()
        .substring(0, 3)
        .toUpperCase();
      const branchCode = `MB-${citySlug || 'PH'}-${String(branches.length + branchApplications.length + 1).padStart(2, '0')}`;
      const appId = `app-${Date.now()}`;

      const newApp: BranchApplication = {
        id: appId,
        branchName: data.branchName,
        branchCode,
        businessType: data.businessType,
        address: data.address,
        contactNumber: data.contactNumber,
        email: data.email,
        operatingHours: data.operatingHours,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        managerGovId: data.managerGovId,
        documents: data.documents || [],
        status: 'Pending Review',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setBranchApplications((prev) => [newApp, ...prev]);
      firestoreSync.saveDoc('branch_applications', newApp.id, newApp);

      if (data.documents && data.documents.length > 0) {
        data.documents.forEach((d) => {
          firestoreSync.saveDoc('branch_documents', d.id, d);
        });
        setBranchDocuments((prev) => [...data.documents!, ...prev]);
      }

      logBranchAudit(
        'Application Submitted',
        `New franchise branch application submitted for "${data.branchName}" (${branchCode}) by applicant ${data.managerName}.`,
        appId,
        data.branchName
      );

      return newApp;
    },
    [branches.length, branchApplications.length, logBranchAudit]
  );

  const verifyDocument = useCallback(
    (docId: string, status: DocumentVerificationStatus, remarks?: string) => {
      const verifiedAt = new Date().toISOString();
      const verifiedBy = currentUser ? currentUser.name : 'HQ Compliance Officer';

      setBranchDocuments((prev) =>
        prev.map((d) => {
          if (d.id === docId) {
            const updated = { ...d, status, remarks: remarks || d.remarks, verifiedAt, verifiedBy };
            firestoreSync.saveDoc('branch_documents', updated.id, updated);
            return updated;
          }
          return d;
        })
      );

      setBranchApplications((prev) =>
        prev.map((app) => {
          if (app.documents && app.documents.some((d) => d.id === docId)) {
            const updatedDocs = app.documents.map((d) =>
              d.id === docId ? { ...d, status, remarks: remarks || d.remarks, verifiedAt, verifiedBy } : d
            );
            const updatedApp = { ...app, documents: updatedDocs, updatedAt: verifiedAt };
            firestoreSync.saveDoc('branch_applications', updatedApp.id, updatedApp);
            return updatedApp;
          }
          return app;
        })
      );

      const actionName =
        status === 'verified'
          ? 'Document Approved'
          : status === 'rejected'
          ? 'Documents Rejected'
          : 'Document Resubmission Requested';
      logBranchAudit(actionName, `Document ${docId} set to "${status}". Remarks: ${remarks || 'None'}`);
    },
    [currentUser, logBranchAudit]
  );

  const updateApplicationStatus = useCallback(
    (applicationId: string, status: ApplicationStatus, notes?: string, remarks?: string) => {
      const now = new Date().toISOString();
      const reviewer = currentUser?.name || 'HQ Admin';

      setBranchApplications((prev) =>
        prev.map((app) => {
          if (app.id === applicationId) {
            const updated: BranchApplication = {
              ...app,
              status,
              reviewNotes: notes !== undefined ? notes : app.reviewNotes,
              revisionRemarks: remarks !== undefined ? remarks : app.revisionRemarks,
              updatedAt: now,
              reviewedAt: now,
              reviewedBy: reviewer,
            };
            firestoreSync.saveDoc('branch_applications', updated.id, updated);
            return updated;
          }
          return app;
        })
      );

      logBranchAudit('Application Status Updated', `Application ${applicationId} status updated to "${status}". Notes: ${notes || remarks || 'N/A'}`);
    },
    [currentUser, logBranchAudit]
  );

  const rejectBranchApplication = useCallback(
    (applicationId: string, reason: string) => {
      const now = new Date().toISOString();
      const reviewer = currentUser?.name || 'HQ Admin';

      setBranchApplications((prev) =>
        prev.map((app) => {
          if (app.id === applicationId) {
            const updated: BranchApplication = {
              ...app,
              status: 'Rejected',
              rejectionReason: reason,
              updatedAt: now,
              reviewedAt: now,
              reviewedBy: reviewer,
            };
            firestoreSync.saveDoc('branch_applications', updated.id, updated);
            return updated;
          }
          return app;
        })
      );

      logBranchAudit('Application Rejected', `Application ${applicationId} rejected. Reason: ${reason}`);
    },
    [currentUser, logBranchAudit]
  );

  const requestDocumentResubmission = useCallback(
    (applicationId: string, docId: string, reason: string) => {
      verifyDocument(docId, 'resubmission_requested', reason);
      updateApplicationStatus(applicationId, 'Requires Revision', undefined, reason);
    },
    [verifyDocument, updateApplicationStatus]
  );

  const approveBranchApplication = useCallback(
    (applicationId: string): { branch: Branch; managerAccount: BranchAccount; staffAccount: BranchAccount } | null => {
      const app = branchApplications.find((a) => a.id === applicationId);
      if (!app) return null;

      const slug = app.branchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let branchId = `b-${slug}`;
      let counter = 1;
      while (branches.some((b) => b.id === branchId)) {
        branchId = `b-${slug}-${counter++}`;
      }

      const now = new Date().toISOString();

      // 1. Create Branch record
      const newBranch: Branch = {
        id: branchId,
        name: app.branchName,
        code: app.branchCode,
        businessType: app.businessType,
        location: app.address,
        contactNumber: app.contactNumber,
        email: app.email,
        operatingHours: app.operatingHours,
        status: 'Active',
        managerName: app.managerName,
        managerPhone: app.managerPhone,
        managerEmail: app.managerEmail,
        managerGovId: app.managerGovId,
        applicationId: app.id,
        createdAt: now,
      };

      // 2. Create Branch Manager user & account
      const managerTempPassword = `MB-${app.branchCode.replace(/[^A-Za-z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}!`;
      const managerUsername = `${slug}.mgr`;
      const managerUser: UserModel = {
        id: `u-${branchId}`,
        name: `${app.managerName} (${app.branchName} Manager)`,
        email: app.managerEmail || `${slug}@marshbites.com`,
        password: managerTempPassword,
        role: 'branch',
        branchId,
      };

      const managerAccount: BranchAccount = {
        id: `acc-${branchId}-mgr`,
        branchId,
        branchName: app.branchName,
        username: managerUsername,
        temporaryPassword: managerTempPassword,
        fullName: app.managerName,
        email: app.managerEmail || `${slug}@marshbites.com`,
        phone: app.managerPhone,
        role: 'Branch Manager',
        permissions: ['View Branch Inventory', 'Submit Requisition Orders', 'View Sales & Demand Reports', 'Manage Branch Staff', 'Confirm Stock Delivery'],
        isActive: true,
        credentialsSent: false,
        createdAt: now,
      };

      // 3. Create Staff account
      const staffTempPassword = `MB-Staff-${Math.floor(1000 + Math.random() * 9000)}`;
      const staffUsername = `${slug}.staff1`;
      const staffAccount: BranchAccount = {
        id: `acc-${branchId}-staff1`,
        branchId,
        branchName: app.branchName,
        username: staffUsername,
        temporaryPassword: staffTempPassword,
        fullName: `${app.branchName} Counter Staff`,
        email: `staff.${slug}@marshbites.com`,
        role: 'Staff',
        permissions: ['Inventory Management', 'Order Processing', 'Sales Recording & POS'],
        isActive: true,
        credentialsSent: false,
        createdAt: now,
      };

      // 4. Initialize Branch Inventory for all products (0 stock)
      const newInvItems: InventoryItem[] = products.map((p) => ({
        id: `inv-${branchId}-${p.id}`,
        branchId,
        productId: p.id,
        productName: `${p.flavor} (${p.name})`,
        stock: 0,
      }));

      // 5. Update Application Status to Approved
      const updatedApp: BranchApplication = {
        ...app,
        status: 'Approved',
        approvedBranchId: branchId,
        updatedAt: now,
        reviewedAt: now,
        reviewedBy: currentUser?.name || 'Super Admin (Headquarters)',
      };

      // 6. Record Status History
      const statusHist: BranchStatusHistory = {
        id: `hist-${Date.now()}`,
        branchId,
        branchName: app.branchName,
        previousStatus: 'Pending Activation',
        newStatus: 'Active',
        reason: `Branch onboarding application ${app.id} approved by HQ.`,
        changedBy: currentUser?.name || 'Super Admin',
        timestamp: now,
      };

      // Update States
      setBranches((prev) => [...prev, newBranch]);
      setUsers((prev) => [...prev, managerUser]);
      setBranchAccounts((prev) => [...prev, managerAccount, staffAccount]);
      setInventory((prev) => [...prev, ...newInvItems]);
      setBranchApplications((prev) => prev.map((a) => (a.id === app.id ? updatedApp : a)));
      setBranchStatusHistory((prev) => [statusHist, ...prev]);

      // Firestore Writes
      firestoreSync.saveDoc('branches', newBranch.id, newBranch);
      firestoreSync.saveDoc('users', managerUser.id, managerUser);
      firestoreSync.saveDoc('branch_accounts', managerAccount.id, managerAccount);
      firestoreSync.saveDoc('branch_accounts', staffAccount.id, staffAccount);
      firestoreSync.saveDoc('branch_applications', updatedApp.id, updatedApp);
      firestoreSync.saveDoc('branch_status_history', statusHist.id, statusHist);
      newInvItems.forEach((inv) => firestoreSync.saveDoc('inventory', inv.id, inv));

      logBranchAudit(
        'Branch Approved',
        `Branch Application approved! Created store profile "${newBranch.name}" (${newBranch.code}), generated initial 0-stock inventory catalog, and auto-provisioned Manager & Staff accounts.`,
        branchId,
        newBranch.name
      );

      return { branch: newBranch, managerAccount, staffAccount };
    },
    [branchApplications, branches, products, currentUser, logBranchAudit]
  );

  const setBranchStatus = useCallback(
    (branchId: string, newStatus: BranchStatus, reason: string) => {
      const branch = branches.find((b) => b.id === branchId);
      if (!branch) return;

      const previousStatus = branch.status || 'Active';
      const now = new Date().toISOString();
      const changedBy = currentUser?.name || 'HQ Admin';

      const updatedBranch: Branch = {
        ...branch,
        status: newStatus,
        updatedAt: now,
        suspensionReason: newStatus === 'Suspended' ? reason : undefined,
        closedAt: newStatus === 'Closed' ? now : branch.closedAt,
        archivedAt: newStatus === 'Inactive' || newStatus === 'Closed' ? now : branch.archivedAt,
      };

      const statusHist: BranchStatusHistory = {
        id: `hist-${Date.now()}`,
        branchId,
        branchName: branch.name,
        previousStatus,
        newStatus,
        reason,
        changedBy,
        timestamp: now,
      };

      setBranches((prev) => prev.map((b) => (b.id === branchId ? updatedBranch : b)));
      setBranchStatusHistory((prev) => [statusHist, ...prev]);

      firestoreSync.saveDoc('branches', updatedBranch.id, updatedBranch);
      firestoreSync.saveDoc('branch_status_history', statusHist.id, statusHist);

      // If branch is closed/suspended, disable user logins
      if (newStatus === 'Closed' || newStatus === 'Suspended') {
        setBranchAccounts((prev) =>
          prev.map((acc) => {
            if (acc.branchId === branchId) {
              const uAcc = { ...acc, isActive: false };
              firestoreSync.saveDoc('branch_accounts', uAcc.id, uAcc);
              return uAcc;
            }
            return acc;
          })
        );
      } else if (newStatus === 'Active') {
        setBranchAccounts((prev) =>
          prev.map((acc) => {
            if (acc.branchId === branchId) {
              const uAcc = { ...acc, isActive: true };
              firestoreSync.saveDoc('branch_accounts', uAcc.id, uAcc);
              return uAcc;
            }
            return acc;
          })
        );
      }

      const actionName =
        newStatus === 'Suspended'
          ? 'Branch Suspended'
          : newStatus === 'Active'
          ? previousStatus === 'Suspended'
            ? 'Branch Reopened'
            : 'Branch Activated'
          : newStatus === 'Closed'
          ? 'Branch Closed (Soft Deleted)'
          : 'Status Changed';
      logBranchAudit(actionName, `Status changed from "${previousStatus}" to "${newStatus}". Reason: ${reason}`, branchId, branch.name);
    },
    [branches, currentUser, logBranchAudit]
  );

  const activateBranch = useCallback(
    (branchId: string, reason = 'Operational readiness verified and activated by HQ') => {
      setBranchStatus(branchId, 'Active', reason);
    },
    [setBranchStatus]
  );

  const suspendBranch = useCallback(
    (branchId: string, reason: string) => {
      setBranchStatus(branchId, 'Suspended', reason);
    },
    [setBranchStatus]
  );

  const reopenBranch = useCallback(
    (branchId: string, reason = 'Compliance and audit remediation verified. Operational clearance granted.') => {
      setBranchStatus(branchId, 'Active', reason);
    },
    [setBranchStatus]
  );

  const archiveBranch = useCallback(
    (branchId: string, reason = 'Branch archived by HQ Administrator') => {
      setBranchStatus(branchId, 'Inactive', reason);
    },
    [setBranchStatus]
  );

  const softDeleteBranch = useCallback(
    (branchId: string, reason: string) => {
      setBranchStatus(branchId, 'Closed', reason);
    },
    [setBranchStatus]
  );

  const checkPermanentDeletionEligibility = useCallback(
    (branchId: string) => {
      const reasons: string[] = [];

      const branchOrders = orders.filter((o) => o.branchId === branchId);
      const pendingOrders = branchOrders.filter(
        (o) => o.status === 'pending' || o.status === 'waitingApproval' || o.status === 'in_production'
      ).length;
      if (pendingOrders > 0) {
        reasons.push(`Branch has ${pendingOrders} pending or in-production orders that must be settled first.`);
      }

      const activeDeliveries = deliveries.filter(
        (d) => d.branchId === branchId && (d.status === 'inTransit' || d.status === 'pending')
      ).length;
      if (activeDeliveries > 0) {
        reasons.push(`Branch has ${activeDeliveries} active deliveries currently in transit or scheduled.`);
      }

      const branchInv = inventory.filter((i) => i.branchId === branchId);
      const totalUnits = branchInv.reduce((sum, i) => sum + i.stock, 0);
      const unresolvedDiscrepancies = totalUnits > 0 ? totalUnits : 0;
      if (totalUnits > 0) {
        reasons.push(`Branch currently holds ${totalUnits} active inventory units on-site. Inventory must be zeroed out or transferred first.`);
      }

      const unpaidBalances = branchOrders
        .filter((o) => o.status === 'approved' && !o.proofImagePath)
        .reduce((sum, o) => sum + o.totalAmount, 0);
      if (unpaidBalances > 0) {
        reasons.push(`Branch has unverified payment receipts totaling ₱${unpaidBalances.toLocaleString()}.`);
      }

      return {
        eligible: reasons.length === 0,
        reasons,
        pendingOrders,
        unresolvedDiscrepancies,
        unpaidBalances,
      };
    },
    [orders, deliveries, inventory]
  );

  const permanentDeleteBranch = useCallback(
    (branchId: string, auditRemarks: string) => {
      const eligibility = checkPermanentDeletionEligibility(branchId);
      const branch = branches.find((b) => b.id === branchId);

      if (!branch) {
        return { success: false, backupSnapshot: null, message: 'Branch not found.' };
      }

      if (!eligibility.eligible) {
        return {
          success: false,
          backupSnapshot: null,
          message: `Deletion blocked by safety pre-conditions: ${eligibility.reasons.join(' ')}`,
        };
      }

      const backupSnapshot = {
        backupTimestamp: new Date().toISOString(),
        deletedBy: currentUser?.name || 'Super Admin (Headquarters)',
        reason: auditRemarks,
        branchData: branch,
        branchAccounts: branchAccounts.filter((a) => a.branchId === branchId),
        branchDocuments: branchDocuments.filter((d) => d.branchId === branchId),
        branchInventory: inventory.filter((i) => i.branchId === branchId),
        branchOrders: orders.filter((o) => o.branchId === branchId),
        branchSales: sales.filter((s) => s.branchId === branchId),
        branchHistory: branchStatusHistory.filter((h) => h.branchId === branchId),
      };

      setBranches((prev) => prev.filter((b) => b.id !== branchId));
      setUsers((prev) => prev.filter((u) => u.branchId !== branchId));
      setBranchAccounts((prev) => prev.filter((a) => a.branchId !== branchId));
      setInventory((prev) => prev.filter((i) => i.branchId !== branchId));

      firestoreSync.removeDoc('branches', branchId);
      firestoreSync.removeDoc('users', `u-${branchId}`);
      inventory.filter((i) => i.branchId === branchId).forEach((i) => firestoreSync.removeDoc('inventory', i.id));
      branchAccounts.filter((a) => a.branchId === branchId).forEach((a) => firestoreSync.removeDoc('branch_accounts', a.id));

      logBranchAudit(
        'Branch Permanently Deleted',
        `Permanent deletion executed for branch "${branch.name}" (${branch.code || branch.id}). Safety pre-conditions verified. Database backup archive generated. Remarks: ${auditRemarks}`,
        branchId,
        branch.name,
        { backupSnapshotId: `backup-${Date.now()}` }
      );

      return {
        success: true,
        backupSnapshot,
        message: `Branch "${branch.name}" has been permanently purged with pre-condition audit verification. Backup export generated.`,
      };
    },
    [
      checkPermanentDeletionEligibility,
      branches,
      currentUser,
      branchAccounts,
      branchDocuments,
      inventory,
      orders,
      sales,
      branchStatusHistory,
      logBranchAudit,
    ]
  );

  const createBranchAccount = useCallback(
    (payload: {
      branchId: string;
      fullName: string;
      email: string;
      role: BranchAccountRole;
      phone?: string;
      permissions?: string[];
    }): BranchAccount => {
      const branch = branches.find((b) => b.id === payload.branchId);
      const branchName = branch?.name || 'Branch';
      const slug = (branch?.name || payload.fullName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const roleSlug = payload.role.toLowerCase().replace(/[^a-z0-9]+/g, '');
      const username = `${slug}.${roleSlug}-${Math.floor(10 + Math.random() * 90)}`;
      const temporaryPassword = `MB-${roleSlug.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}!`;

      const defaultPermissions =
        payload.permissions ||
        (payload.role === 'Branch Manager'
          ? ['View Branch Inventory', 'Submit Requisition Orders', 'View Sales & Demand Reports', 'Manage Branch Staff', 'Confirm Stock Delivery']
          : payload.role === 'Cashier'
          ? ['Sales Recording & POS', 'View Daily Cash Register']
          : payload.role === 'Inventory Specialist'
          ? ['Inventory Management', 'Quality Receiving Inspections', 'Stock Replenishment Logs']
          : ['Inventory Management', 'Order Processing', 'Sales Recording & POS']);

      const newAcc: BranchAccount = {
        id: `acc-${Date.now()}`,
        branchId: payload.branchId,
        branchName,
        username,
        temporaryPassword,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        permissions: defaultPermissions,
        isActive: true,
        credentialsSent: false,
        createdAt: new Date().toISOString(),
      };

      setBranchAccounts((prev) => [...prev, newAcc]);
      firestoreSync.saveDoc('branch_accounts', newAcc.id, newAcc);

      const newUserModel: UserModel = {
        id: `u-${newAcc.id}`,
        name: `${payload.fullName} (${branchName} ${payload.role})`,
        email: payload.email,
        password: temporaryPassword,
        role: 'branch',
        branchId: payload.branchId,
      };
      setUsers((prev) => [...prev, newUserModel]);
      firestoreSync.saveDoc('users', newUserModel.id, newUserModel);

      logBranchAudit(
        'Staff Account Created',
        `Created ${payload.role} account for ${payload.fullName} (${payload.email}) at branch ${branchName}.`,
        payload.branchId,
        branchName
      );

      return newAcc;
    },
    [branches, logBranchAudit]
  );

  const updateBranchAccount = useCallback(
    (account: BranchAccount) => {
      setBranchAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
      firestoreSync.saveDoc('branch_accounts', account.id, account);
      logBranchAudit('Account Updated', `Updated account profile for ${account.fullName} (${account.username})`, account.branchId, account.branchName);
    },
    [logBranchAudit]
  );

  const resetBranchAccountPassword = useCallback(
    (accountId: string) => {
      const temporaryPassword = `MB-Reset-${Math.floor(1000 + Math.random() * 9000)}!`;
      setBranchAccounts((prev) =>
        prev.map((a) => {
          if (a.id === accountId) {
            const u = { ...a, temporaryPassword, credentialsSent: false };
            firestoreSync.saveDoc('branch_accounts', u.id, u);
            return u;
          }
          return a;
        })
      );

      const acc = branchAccounts.find((a) => a.id === accountId);
      if (acc) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.email.toLowerCase() === acc.email.toLowerCase()) {
              const updated = { ...u, password: temporaryPassword };
              firestoreSync.saveDoc('users', updated.id, updated);
              return updated;
            }
            return u;
          })
        );
        logBranchAudit('Password Reset', `Generated new temporary credentials for ${acc.fullName} (${acc.username})`, acc.branchId, acc.branchName);
      }

      return { temporaryPassword };
    },
    [branchAccounts, logBranchAudit]
  );

  const toggleBranchAccountActive = useCallback((accountId: string, isActive: boolean) => {
    setBranchAccounts((prev) =>
      prev.map((a) => {
        if (a.id === accountId) {
          const u = { ...a, isActive };
          firestoreSync.saveDoc('branch_accounts', u.id, u);
          return u;
        }
        return a;
      })
    );
  }, []);

  const sendAccountCredentials = useCallback((accountId: string): boolean => {
    const now = new Date().toISOString();
    setBranchAccounts((prev) =>
      prev.map((a) => {
        if (a.id === accountId) {
          const u = { ...a, credentialsSent: true, credentialsSentAt: now };
          firestoreSync.saveDoc('branch_accounts', u.id, u);
          return u;
        }
        return a;
      })
    );
    return true;
  }, []);

  const getApplicationDocuments = useCallback(
    (appId: string) => {
      return branchDocuments.filter((d) => d.applicationId === appId);
    },
    [branchDocuments]
  );

  const getBranchDocuments = useCallback(
    (branchId: string) => {
      return branchDocuments.filter((d) => d.branchId === branchId);
    },
    [branchDocuments]
  );

  const getBranchAccounts = useCallback(
    (branchId: string) => {
      return branchAccounts.filter((a) => a.branchId === branchId);
    },
    [branchAccounts]
  );

  const getBranchStatusHistory = useCallback(
    (branchId: string) => {
      return branchStatusHistory.filter((h) => h.branchId === branchId);
    },
    [branchStatusHistory]
  );

  const getBranchAuditLogs = useCallback(
    (branchId?: string) => {
      if (!branchId) return branchAuditLogs;
      return branchAuditLogs.filter((l) => l.branchId === branchId);
    },
    [branchAuditLogs]
  );

  const addBranch = (
    name: string,
    location: string,
    businessType?: string,
    contactNumber?: string,
    email?: string,
    operatingHours?: string,
    managerName?: string,
    managerPhone?: string,
    managerEmail?: string,
    managerGovId?: string
  ): Branch => {
    const cleanName = name.trim();
    const cleanLocation = location.trim();
    if (!cleanName || !cleanLocation) {
      throw new Error('Branch name and location are required');
    }

    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    let branchId = `b-${slug}`;
    let counter = 1;
    while (branches.some((b) => b.id === branchId)) {
      branchId = `b-${slug}-${counter++}`;
    }

    const citySlug = cleanLocation.split(',')[0].replace(/Marsh Bites/gi, '').trim().substring(0, 3).toUpperCase();
    const code = `MB-${citySlug || 'PH'}-${String(branches.length + 1).padStart(2, '0')}`;
    const now = new Date().toISOString();

    const newBranch: Branch = {
      id: branchId,
      name: cleanName,
      code,
      businessType: businessType || 'Mall Kiosk',
      location: cleanLocation,
      contactNumber: contactNumber || '+63 917 123 4567',
      email: email || `${slug}@marshbites.com`,
      operatingHours: operatingHours || '10:00 AM - 9:00 PM',
      status: 'Active',
      managerName: managerName || `${cleanName} Manager`,
      managerPhone: managerPhone || '+63 917 555 0100',
      managerEmail: managerEmail || `${slug}@marshbites.com`,
      managerGovId: managerGovId || 'SSS-12-3456789-0',
      createdAt: now,
    };

    const newManager: UserModel = {
      id: `u-${branchId}`,
      name: managerName || `${cleanName} Manager`,
      email: managerEmail || `${slug}@marshbites.com`,
      password: 'branch123',
      role: 'branch',
      branchId,
    };

    const newManagerAccount: BranchAccount = {
      id: `acc-${branchId}-mgr`,
      branchId,
      branchName: cleanName,
      username: `${slug}.mgr`,
      temporaryPassword: 'branch123',
      fullName: managerName || `${cleanName} Manager`,
      email: managerEmail || `${slug}@marshbites.com`,
      phone: managerPhone || '+63 917 555 0100',
      role: 'Branch Manager',
      permissions: ['View Branch Inventory', 'Submit Requisition Orders', 'View Sales & Demand Reports', 'Manage Branch Staff', 'Confirm Stock Delivery'],
      isActive: true,
      credentialsSent: true,
      createdAt: now,
    };

    const newInvItems: InventoryItem[] = products.map((p) => ({
      id: `inv-${branchId}-${p.id}`,
      branchId,
      productId: p.id,
      productName: `${p.flavor} (${p.name})`,
      stock: 0,
    }));

    setBranches((prev) => [...prev, newBranch]);
    setUsers((prev) => [...prev, newManager]);
    setBranchAccounts((prev) => [...prev, newManagerAccount]);
    setInventory((prev) => [...prev, ...newInvItems]);

    // Firestore writes
    firestoreSync.saveDoc('branches', newBranch.id, newBranch);
    firestoreSync.saveDoc('users', newManager.id, newManager);
    firestoreSync.saveDoc('branch_accounts', newManagerAccount.id, newManagerAccount);
    newInvItems.forEach((item) => firestoreSync.saveDoc('inventory', item.id, item));

    logBranchAudit(
      'Branch Created',
      `Manual branch onboarding completed for "${newBranch.name}" (${newBranch.code}).`,
      branchId,
      newBranch.name
    );

    return newBranch;
  };

  const addProduct = (name: string, flavor: string, price: number, adminStock: number, wholesalePrice?: number) => {
    const newId = `p-${Date.now()}`;
    const newProd: Product = {
      id: newId,
      name,
      flavor,
      price,
      wholesalePrice: wholesalePrice !== undefined ? wholesalePrice : 100,
      adminStock,
    };
    setProducts((prev) => [...prev, newProd]);

    const newInv: InventoryItem[] = branches.map((b) => ({
      id: `inv-${b.id}-${newId}`,
      branchId: b.id,
      productId: newId,
      productName: `${flavor} (${name})`,
      stock: 0,
    }));
    setInventory((prev) => [...prev, ...newInv]);

    // Firestore writes
    firestoreSync.saveDoc('products', newProd.id, newProd);
    newInv.forEach((inv) => firestoreSync.saveDoc('inventory', inv.id, inv));
  };

  const updateProduct = (p: Product) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setInventory((prev) =>
      prev.map((i) =>
        i.productId === p.id
          ? { ...i, productName: `${p.flavor} (${p.name})` }
          : i
      )
    );
    firestoreSync.saveDoc('products', p.id, p);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setInventory((prev) => prev.filter((i) => i.productId !== id));
    firestoreSync.removeDoc('products', id);
  };

  const logProduction = (productId: string, quantity: number) => {
    let updatedProduct: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedProduct = { ...p, adminStock: p.adminStock + quantity };
          return updatedProduct;
        }
        return p;
      })
    );
    if (updatedProduct) {
      firestoreSync.saveDoc('products', productId, updatedProduct);
    }
  };

  const logProductionBatch = (payload: {
    productId: string;
    quantity: number;
    targetOrderId?: string;
    targetBranchName?: string;
    chefName?: string;
    stage?: BatchStage;
    notes?: string;
  }): ProductionBatch => {
    const prod = products.find((p) => p.id === payload.productId);
    const flavor = prod ? prod.flavor : 'Custom Marshmallow';
    const now = new Date();
    const batchCode = `MTO-${flavor.slice(0, 3).toUpperCase()}-${now.getMonth() + 1}${now.getDate()}-${Math.floor(100 + Math.random() * 900)}`;

    const newBatch: ProductionBatch = {
      id: `batch-mto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      batchCode,
      productId: payload.productId,
      productFlavor: flavor,
      quantity: payload.quantity,
      targetOrderId: payload.targetOrderId,
      targetBranchName: payload.targetBranchName,
      stage: payload.stage || 'in_kettle',
      chefName: payload.chefName || 'Chef Dante (Head Confectioner)',
      startedAt: now.toISOString(),
      notes: payload.notes || 'Made-to-order artisanal batch in Bicol Commissary',
    };

    setProductionBatches((prev) => [newBatch, ...prev]);
    firestoreSync.saveDoc('production_batches', newBatch.id, newBatch);

    // If targetOrderId provided, update order's batchCode and stage
    if (payload.targetOrderId) {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === payload.targetOrderId) {
            const updated = {
              ...ord,
              batchCode: ord.batchCode || batchCode,
              productionStage: (ord.productionStage === 'queued' ? 'in_kettle' : ord.productionStage) as ProductionStage,
            };
            firestoreSync.saveDoc('orders', ord.id, updated);
            return updated;
          }
          return ord;
        })
      );
    }

    return newBatch;
  };

  const updateBatchStage = (batchId: string, stage: BatchStage) => {
    let targetBatch: ProductionBatch | undefined;
    setProductionBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const completedAt = stage === 'completed' ? new Date().toISOString() : b.completedAt;
          targetBatch = { ...b, stage, completedAt };
          firestoreSync.saveDoc('production_batches', batchId, targetBatch);
          return targetBatch;
        }
        return b;
      })
    );

    // If batch was completed, optionally replenish product adminStock
    if (stage === 'completed' && targetBatch) {
      logProduction(targetBatch.productId, targetBatch.quantity);
    }
  };

  const updateOrderProductionStage = (orderId: string, stage: ProductionStage, batchCode?: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder && stage !== 'queued') {
      if (targetOrder.status !== 'approved' || !targetOrder.proofImagePath || targetOrder.proofImagePath.trim() === '') {
        console.warn(`[DataContext] Cannot advance MTO stage for order ${orderId}: Order must be approved with verified payment proof.`);
        throw new Error('Order must be approved with verified payment proof before commissary batching.');
      }
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            productionStage: stage,
            batchCode: batchCode || o.batchCode,
          };
          firestoreSync.saveDoc('orders', orderId, updated);
          return updated;
        }
        return o;
      })
    );
  };

  const produceForOrder = (orderId: string, chefName?: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (targetOrder.status !== 'approved' || !targetOrder.proofImagePath || targetOrder.proofImagePath.trim() === '') {
      console.warn(`[DataContext] Cannot start commissary batching for order ${orderId}: Order must be approved and payment proof verified.`);
      throw new Error('Order must be approved with verified payment proof before commissary batching.');
    }

    const shortBranch = targetOrder.branchName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const batchCode = `MTO-${shortBranch}-${targetOrder.id.slice(-4)}`;
    const now = new Date();

    const newBatches: ProductionBatch[] = targetOrder.items.map((item, idx) => ({
      id: `batch-${Date.now()}-${idx}-${item.productId}`,
      batchCode: `${batchCode}-${item.productId.toUpperCase()}`,
      productId: item.productId,
      productFlavor: item.productName.split('(')[0].trim(),
      quantity: item.quantity,
      targetOrderId: targetOrder.id,
      targetBranchName: targetOrder.branchName,
      stage: 'in_kettle',
      chefName: chefName || (idx % 2 === 0 ? 'Chef Dante (Head Confectioner)' : 'Chef Maria (Bicol Fluff Artisan)'),
      startedAt: now.toISOString(),
      notes: `Made-to-order fresh cook for ${targetOrder.branchName} #${targetOrder.id}`,
    }));

    setProductionBatches((prev) => [...newBatches, ...prev]);
    newBatches.forEach((b) => firestoreSync.saveDoc('production_batches', b.id, b));

    const updatedOrder: Order = {
      ...targetOrder,
      batchCode,
      productionStage: 'in_kettle',
      estimatedReadyDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    firestoreSync.saveDoc('orders', orderId, updatedOrder);
  };

  const addProductionStock = (branchId: string, productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.adminStock < quantity) {
      throw new Error('Insufficient Admin Stock available in central commissary');
    }

    const updatedProd = { ...prod, adminStock: prod.adminStock - quantity };
    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));
    firestoreSync.saveDoc('products', productId, updatedProd);

    setInventory((prev) => {
      const exists = prev.find((i) => i.branchId === branchId && i.productId === productId);
      if (exists) {
        const updatedInv = { ...exists, stock: exists.stock + quantity };
        firestoreSync.saveDoc('inventory', exists.id, updatedInv);
        return prev.map((i) => (i.id === exists.id ? updatedInv : i));
      } else {
        const newInv: InventoryItem = {
          id: `inv-${branchId}-${productId}`,
          branchId,
          productId,
          productName: `${prod.flavor} (${prod.name})`,
          stock: quantity,
        };
        firestoreSync.saveDoc('inventory', newInv.id, newInv);
        return [...prev, newInv];
      }
    });
  };

  const createOrder = (
    items: { productId: string; productName: string; quantity: number; unitPrice: number }[],
    customTotal?: number,
    packageName?: string,
    packageTier?: 'silver' | 'gold' | 'platinum'
  ): Order | null => {
    if (!currentUser || !currentUser.branchId) return null;
    const branch = getBranch(currentUser.branchId);
    if (!branch) return null;

    const computedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const finalTotal = customTotal !== undefined && customTotal > 0 ? customTotal : computedTotal;
    const shortBranch = branch.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const orderIdSuffix = Date.now().toString().slice(-4);
    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-6)}`,
      branchId: branch.id,
      branchName: branch.name,
      status: 'pending',
      productionStage: 'queued',
      batchCode: `MTO-${shortBranch}-${orderIdSuffix}`,
      totalAmount: finalTotal,
      createdAt: new Date().toISOString(),
      items,
      packageName,
      packageTier,
    };

    setOrders((prev) => [newOrder, ...prev]);
    firestoreSync.saveDoc('orders', newOrder.id, newOrder);
    return newOrder;
  };

  const uploadPaymentProof = (
    orderId: string,
    proofUrl: string,
    paymentDetails?: {
      paymentMethod?: DigitalPaymentMethod | string;
      paymentIntentId?: string;
      referenceNumber?: string;
      status?: PaymentGatewayStatus;
    }
  ) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = {
            ...o,
            proofImagePath: proofUrl,
            status: 'waitingApproval' as OrderStatus,
            paymentMethod: paymentDetails?.paymentMethod || o.paymentMethod || 'bank_transfer',
            paymentIntentId: paymentDetails?.paymentIntentId || o.paymentIntentId,
            paymentReference: paymentDetails?.referenceNumber || o.paymentReference,
            paymentStatus: paymentDetails?.status || 'PENDING',
            paymentCompletedAt: paymentDetails?.status === 'SUCCESSFUL' ? nowIso : o.paymentCompletedAt,
          };
          firestoreSync.saveDoc('orders', orderId, updated);
          return updated;
        }
        return o;
      })
    );
  };

  const approveOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (!targetOrder.proofImagePath || targetOrder.proofImagePath.trim() === '') {
      console.warn(`[DataContext] Cannot approve order ${orderId}: Payment proof required before approval.`);
      throw new Error('Payment proof required before approval.');
    }

    const updatedOrder = {
      ...targetOrder,
      status: 'approved' as OrderStatus,
      productionStage: targetOrder.productionStage === 'queued' ? 'in_kettle' : targetOrder.productionStage || 'in_kettle',
    };
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    firestoreSync.saveDoc('orders', orderId, updatedOrder);

    // Automatically trigger Made-to-Order kitchen batches if not already triggered
    const existingBatches = productionBatches.filter((b) => b.targetOrderId === orderId);
    if (existingBatches.length === 0) {
      produceForOrder(orderId);
    }

    // Increment branch inventory
    targetOrder.items.forEach((item) => {
      setInventory((prev) => {
        const idx = prev.findIndex((i) => i.branchId === targetOrder.branchId && i.productId === item.productId);
        if (idx !== -1) {
          const updatedInv = { ...prev[idx], stock: prev[idx].stock + item.quantity };
          firestoreSync.saveDoc('inventory', prev[idx].id, updatedInv);
          return prev.map((invItem, i) => (i === idx ? updatedInv : invItem));
        } else {
          const newInv: InventoryItem = {
            id: `inv-${targetOrder.branchId}-${item.productId}`,
            branchId: targetOrder.branchId,
            productId: item.productId,
            productName: item.productName,
            stock: item.quantity,
          };
          firestoreSync.saveDoc('inventory', newInv.id, newInv);
          return [...prev, newInv];
        }
      });
    });
  };

  const rejectOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status: 'rejected' as OrderStatus, rejectionReason: reason };
          firestoreSync.saveDoc('orders', orderId, updated);
          return updated;
        }
        return o;
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    firestoreSync.removeDoc('orders', orderId);
  };

  const archiveOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = { ...o, isArchived: true, status: 'completed' };
          firestoreSync.saveDoc('orders', orderId, updated);
          return updated;
        }
        return o;
      })
    );
  };

  const createDelivery = (
    orderId: string,
    address: string,
    courierName?: string,
    trackingNumber?: string,
    scheduledAt?: string,
    notes?: string,
    extra?: {
      dispatchMethod?: DispatchMethod;
      waybillNumber?: string;
      jtSortingCode?: string;
      driverName?: string;
      vehiclePlateNo?: string;
      receiverContact?: string;
      receiverPhone?: string;
      weightKg?: number;
    }
  ): Delivery => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      if (order.status !== 'approved' && order.status !== 'dispatched') {
        throw new Error('Order must be approved before dispatch.');
      }
    }

    const generatedTracking = trackingNumber || extra?.waybillNumber || `MB-TRACK-${Math.floor(100000 + Math.random() * 900000)}`;
    const newDelivery: Delivery = {
      id: `del-${Date.now().toString().slice(-6)}`,
      orderId,
      branchId: order ? order.branchId : '',
      address,
      status: 'pending',
      scheduledAt: scheduledAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      courierName: courierName || (extra?.dispatchMethod === 'jt_express' ? 'J&T Express Philippines' : 'Central Logistics Fleet'),
      dispatchMethod: extra?.dispatchMethod || (courierName?.toLowerCase().includes('j&t') ? 'jt_express' : 'company_driver'),
      trackingNumber: generatedTracking,
      waybillNumber: extra?.waybillNumber || generatedTracking,
      jtSortingCode: extra?.jtSortingCode,
      driverName: extra?.driverName,
      vehiclePlateNo: extra?.vehiclePlateNo,
      receiverContact: extra?.receiverContact,
      receiverPhone: extra?.receiverPhone,
      weightKg: extra?.weightKg,
      notes,
    };

    // Mark order as dispatched and update productionStage to ready_for_dispatch
    if (order) {
      const updatedOrder: Order = {
        ...order,
        status: 'dispatched',
        productionStage: 'ready_for_dispatch',
        isDispatched: true,
        dispatchMethod: newDelivery.dispatchMethod,
        waybillNumber: newDelivery.waybillNumber,
        trackingNumber: newDelivery.trackingNumber,
      };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      firestoreSync.saveDoc('orders', orderId, updatedOrder);
    }

    setDeliveries((prev) => [newDelivery, ...prev]);
    firestoreSync.saveDoc('deliveries', newDelivery.id, newDelivery);
    return newDelivery;
  };

  const updateDeliveryStatus = (deliveryId: string, status: DeliveryStatus, deliveredAt?: string) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          const updated = {
            ...d,
            status,
            deliveredAt: status === 'delivered' ? deliveredAt || new Date().toISOString() : d.deliveredAt,
          };
          firestoreSync.saveDoc('deliveries', deliveryId, updated);
          return updated;
        }
        return d;
      })
    );
  };

  const cancelDelivery = (deliveryId: string, reason?: string) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          const updated: Delivery = {
            ...d,
            status: 'canceled',
            notes: reason ? `${d.notes || ''} [Cancelled: ${reason}]`.trim() : d.notes,
          };
          firestoreSync.saveDoc('deliveries', deliveryId, updated);
          return updated;
        }
        return d;
      })
    );

    // If there is an associated order, mark as approved (reverted from dispatched)
    const targetDel = deliveries.find((d) => d.id === deliveryId);
    if (targetDel && targetDel.orderId) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === targetDel.orderId) {
            const updated: Order = {
              ...o,
              status: 'approved',
              isDispatched: false,
              productionStage: 'ready_for_dispatch',
            };
            firestoreSync.saveDoc('orders', o.id, updated);
            return updated;
          }
          return o;
        })
      );
    }
  };

  const createReceiving = (
    deliveryId: string,
    receiverName?: string,
    conditionNotes?: string,
    notes?: string
  ): Receiving => {
    const del = deliveries.find((d) => d.id === deliveryId);
    const newRec: Receiving = {
      id: `rec-${Date.now().toString().slice(-6)}`,
      deliveryId,
      orderId: del ? del.orderId : '',
      branchId: del ? del.branchId : '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      receiverName,
      conditionNotes,
      notes,
    };
    setReceivings((prev) => [newRec, ...prev]);
    firestoreSync.saveDoc('receivings', newRec.id, newRec);
    return newRec;
  };

  const updateReceivingStatus = (
    receivingId: string,
    status: ReceivingStatus,
    conditionNotes?: string,
    receiverName?: string
  ) => {
    setReceivings((prev) =>
      prev.map((r) => {
        if (r.id === receivingId) {
          const updated = {
            ...r,
            status,
            receivedAt: status === 'received' ? new Date().toISOString() : r.receivedAt,
            conditionNotes: conditionNotes !== undefined ? conditionNotes : r.conditionNotes,
            receiverName: receiverName !== undefined ? receiverName : r.receiverName,
          };
          firestoreSync.saveDoc('receivings', receivingId, updated);
          return updated;
        }
        return r;
      })
    );
  };

  const createReceivingInspection = (
    deliveryId: string,
    orderId: string,
    status: ReceivingStatus,
    receiverName: string,
    conditionNotes: string
  ) => {
    const del = deliveries.find((d) => d.id === deliveryId);
    const order = orders.find((o) => o.id === (orderId || del?.orderId));
    const targetBranchId = del?.branchId || order?.branchId || currentUser?.branchId || '';
    const nowIso = new Date().toISOString();

    const existing = receivings.find((r) => r.deliveryId === deliveryId);
    if (existing) {
      updateReceivingStatus(existing.id, status, conditionNotes, receiverName);
    } else {
      const newRec: Receiving = {
        id: `rec-${Date.now().toString().slice(-6)}`,
        deliveryId,
        orderId: order?.id || orderId,
        branchId: targetBranchId,
        status,
        createdAt: nowIso,
        receivedAt: status === 'received' ? nowIso : undefined,
        receiverName,
        conditionNotes,
      };
      setReceivings((prev) => [newRec, ...prev]);
      firestoreSync.saveDoc('receivings', newRec.id, newRec);
    }

    if (status === 'received') {
      // 1. Mark Delivery as delivered
      if (del) {
        const updatedDelivery: Delivery = {
          ...del,
          status: 'delivered',
          deliveredAt: nowIso,
        };
        setDeliveries((prev) => prev.map((d) => (d.id === deliveryId ? updatedDelivery : d)));
        firestoreSync.saveDoc('deliveries', deliveryId, updatedDelivery);
      }

      // 2. Automatically update branch inventory with received quantities & record movement records
      if (order && order.items && order.items.length > 0 && targetBranchId) {
        const branchObj = branches.find((b) => b.id === targetBranchId);
        const branchTitle = branchObj?.name || order.branchName || 'Branch';
        const newMovements: InventoryMovementRecord[] = [];

        setInventory((prev) => {
          const nextInv = [...prev];
          for (const item of order.items) {
            const existingIdx = nextInv.findIndex(
              (inv) => inv.branchId === targetBranchId && inv.productId === item.productId
            );
            const prevStock = existingIdx !== -1 ? nextInv[existingIdx].stock : 0;
            const newStock = prevStock + item.quantity;
            const prod = products.find((p) => p.id === item.productId);
            const prodName = item.productName || `${prod?.flavor || 'Flavor'} (${prod?.name || 'Product'})`;

            if (existingIdx !== -1) {
              const updated = { ...nextInv[existingIdx], stock: newStock };
              nextInv[existingIdx] = updated;
              firestoreSync.saveDoc('inventory', updated.id, updated);
            } else {
              const newInvItem: InventoryItem = {
                id: `inv-${targetBranchId}-${item.productId}`,
                branchId: targetBranchId,
                productId: item.productId,
                productName: prodName,
                stock: newStock,
              };
              nextInv.push(newInvItem);
              firestoreSync.saveDoc('inventory', newInvItem.id, newInvItem);
            }

            const mov: InventoryMovementRecord = {
              id: `mov-rec-${Date.now()}-${item.productId}`,
              branchId: targetBranchId,
              productId: item.productId,
              productName: prodName,
              type: 'Commissary Stock-In',
              quantity: item.quantity,
              previousStock,
              newStock,
              referenceNo: del?.trackingNumber || del?.id || order.id,
              performedBy: receiverName || currentUser?.name || 'Branch Receiver',
              timestamp: nowIso,
              notes: `Stock-In via ${del?.courierName || 'Central Logistics'} (Tracking: ${del?.trackingNumber || 'N/A'}) for Requisition #${order.id}. Condition: ${conditionNotes || 'Inspected & Good'}`,
            };
            newMovements.push(mov);
            firestoreSync.saveDoc('inventoryMovements', mov.id, mov);
          }
          return nextInv;
        });

        if (newMovements.length > 0) {
          setInventoryMovements((prev) => [...newMovements, ...prev]);
        }

        // 3. Log permanent transaction in branchAuditLogs ledger
        const totalUnits = order.items.reduce((sum, it) => sum + it.quantity, 0);
        const auditLog: BranchAuditLog = {
          id: `bal-rec-${Date.now()}`,
          branchId: targetBranchId,
          branchName: branchTitle,
          action: 'ORDER_DELIVERY_RECEIVED_STOCK_IN',
          performedBy: receiverName || currentUser?.name || 'Branch Receiver',
          timestamp: nowIso,
          details: `Received delivery (${del?.trackingNumber || deliveryId}) containing ${totalUnits} units for Requisition #${order.id} (₱${order.totalAmount.toLocaleString()}). Items added to on-hand inventory. Inspection notes: ${conditionNotes || 'Passed QC'}.`,
        };
        setBranchAuditLogs((prev) => [auditLog, ...prev]);
        firestoreSync.saveDoc('branchAuditLogs', auditLog.id, auditLog);

        // 4. Automatically archive and mark order completed
        const archivedOrder: Order = {
          ...order,
          status: 'completed',
          isArchived: true,
          isDispatched: true,
          receivedAt: nowIso,
          completedAt: nowIso,
        };
        setOrders((prev) => prev.map((o) => (o.id === order.id ? archivedOrder : o)));
        firestoreSync.saveDoc('orders', order.id, archivedOrder);
      }
    }
  };

  const updateStock = (inventoryId: string, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    setInventory((prev) =>
      prev.map((i) => {
        if (i.id === inventoryId) {
          const updated = { ...i, stock: safeStock };
          firestoreSync.saveDoc('inventory', inventoryId, updated);
          return updated;
        }
        return i;
      })
    );
  };

  const recordSale = (
    productId: string,
    quantity: number,
    customTotal?: number,
    date?: string,
    receiptPath?: string
  ) => {
    if (!currentUser || !currentUser.branchId) {
      throw new Error('Must be logged in as a branch manager to record sales');
    }
    const branchId = currentUser.branchId;
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const inv = inventory.find((i) => i.branchId === branchId && i.productId === productId);
    if (!inv || inv.stock < quantity) {
      throw new Error(`Insufficient stock for ${prod.flavor}. Available: ${inv?.stock ?? 0}`);
    }

    // Deduct stock
    const updatedInv = { ...inv, stock: inv.stock - quantity };
    setInventory((prev) =>
      prev.map((i) => (i.branchId === branchId && i.productId === productId ? updatedInv : i))
    );
    firestoreSync.saveDoc('inventory', inv.id, updatedInv);

    // Record sale
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      branchId,
      productId,
      productName: `${prod.flavor} (${prod.name})`,
      quantity,
      total: customTotal !== undefined ? customTotal : prod.price * quantity,
      date: date || new Date().toISOString(),
      receiptPath: receiptPath || `REC-${Date.now().toString().slice(-6)}`,
    };

    setSales((prev) => [newSale, ...prev]);
    firestoreSync.saveDoc('sales', newSale.id, newSale);
  };

  const recordMultiItemSale = (payload: {
    items: { productId: string; quantity: number; unitPrice: number }[];
    paymentMethod: 'Cash' | 'GCash' | 'Maya' | 'Card' | string;
    amountTendered?: number;
    change?: number;
    discountAmount?: number;
    discountType?: string;
    customerName?: string;
    receiptNumber?: string;
    source?: string;
  }) => {
    if (!currentUser || !currentUser.branchId) {
      throw new Error('Must be logged in as a branch manager to record sales');
    }
    const branchId = currentUser.branchId;
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Cart is empty. Please add items to checkout.');
    }

    // 1. Verify stock for all items
    for (const item of payload.items) {
      const prod = products.find((p) => p.id === item.productId);
      const inv = inventory.find((i) => i.branchId === branchId && i.productId === item.productId);
      const available = inv ? inv.stock : 0;
      if (item.quantity > available) {
        throw new Error(
          `Insufficient stock for ${prod?.flavor || 'item'}. Available: ${available}, Requested: ${item.quantity}`
        );
      }
    }

    const receiptNum =
      payload.receiptNumber ||
      `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const grossTotal = payload.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const discountAmt = Math.min(grossTotal, payload.discountAmount || 0);
    const netTotal = Math.max(0, grossTotal - discountAmt);
    const discountRatio = grossTotal > 0 ? (grossTotal - discountAmt) / grossTotal : 1;

    const nowIso = new Date().toISOString();
    const createdSales: Sale[] = [];

    // 2. Deduct inventory & create sale records
    setInventory((prev) => {
      const nextInv = [...prev];
      for (const item of payload.items) {
        const targetIdx = nextInv.findIndex(
          (i) => i.branchId === branchId && i.productId === item.productId
        );
        if (targetIdx !== -1) {
          const updated = {
            ...nextInv[targetIdx],
            stock: Math.max(0, nextInv[targetIdx].stock - item.quantity),
          };
          nextInv[targetIdx] = updated;
          firestoreSync.saveDoc('inventory', updated.id, updated);
        }
      }
      return nextInv;
    });

    for (let index = 0; index < payload.items.length; index++) {
      const item = payload.items[index];
      const prod = products.find((p) => p.id === item.productId);
      const itemGross = item.quantity * item.unitPrice;
      const itemNet = Math.round(itemGross * discountRatio);

      const saleRecord: Sale = {
        id: `sale-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        branchId,
        productId: item.productId,
        productName: prod ? `${prod.flavor} (${prod.name})` : 'Marsh Bites Box',
        quantity: item.quantity,
        total: itemNet,
        date: nowIso,
        receiptPath: receiptNum,
        paymentMethod: payload.paymentMethod || 'Cash',
        amountTendered: payload.amountTendered,
        change: payload.change,
        discountAmount: discountAmt > 0 ? Math.round(itemGross - itemNet) : 0,
        discountType: payload.discountType,
        customerName: payload.customerName?.trim() || undefined,
        cashierName: currentUser.name,
        source: payload.source || 'VertexIS POS',
      };

      createdSales.push(saleRecord);
      firestoreSync.saveDoc('sales', saleRecord.id, saleRecord);
    }

    setSales((prev) => [...createdSales, ...prev]);

    return {
      receiptNumber: receiptNum,
      totalAmount: netTotal,
      itemsCount: payload.items.reduce((acc, it) => acc + it.quantity, 0),
    };
  };

  const importBatchSales = (
    imported: Array<{
      flavor: string;
      quantity: number;
      total: number;
      date?: string;
      paymentMethod?: string;
      receipt?: string;
    }>
  ) => {
    if (!currentUser || !currentUser.branchId) {
      throw new Error('Must be logged in as a branch manager to import POS records');
    }
    const branchId = currentUser.branchId;
    const errors: string[] = [];
    const salesToAdd: Sale[] = [];
    let successCount = 0;

    for (let i = 0; i < imported.length; i++) {
      const row = imported[i];
      const cleanFlavor = (row.flavor || '').trim().toLowerCase();
      const matchedProd = products.find(
        (p) =>
          p.flavor.toLowerCase().includes(cleanFlavor) ||
          cleanFlavor.includes(p.flavor.toLowerCase()) ||
          p.name.toLowerCase().includes(cleanFlavor)
      );

      if (!matchedProd) {
        errors.push(`Row ${i + 1}: Could not match flavor/product "${row.flavor}" in catalog`);
        continue;
      }

      const qty = Math.max(1, Number(row.quantity) || 1);
      const total = Number(row.total) > 0 ? Number(row.total) : matchedProd.price * qty;
      const rec = row.receipt || `IMP-REC-${Date.now().toString().slice(-5)}-${i + 1}`;
      const rowDate = row.date && !isNaN(new Date(row.date).getTime()) ? new Date(row.date).toISOString() : new Date().toISOString();

      // Deduct inventory
      const invItem = inventory.find((inv) => inv.branchId === branchId && inv.productId === matchedProd.id);
      if (invItem) {
        const updatedInv = { ...invItem, stock: Math.max(0, invItem.stock - qty) };
        setInventory((prev) =>
          prev.map((it) => (it.id === invItem.id ? updatedInv : it))
        );
        firestoreSync.saveDoc('inventory', invItem.id, updatedInv);
      }

      const saleRec: Sale = {
        id: `sale-imp-${Date.now()}-${i}`,
        branchId,
        productId: matchedProd.id,
        productName: `${matchedProd.flavor} (${matchedProd.name})`,
        quantity: qty,
        total,
        date: rowDate,
        receiptPath: rec,
        paymentMethod: row.paymentMethod || 'Cash',
        source: 'Offline Batch Import',
        cashierName: currentUser.name,
      };

      salesToAdd.push(saleRec);
      firestoreSync.saveDoc('sales', saleRec.id, saleRec);
      successCount++;
    }

    if (salesToAdd.length > 0) {
      setSales((prev) => [...salesToAdd, ...prev]);
    }

    return { successCount, errors };
  };

  const addAnnouncement = (title: string, message: string) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    firestoreSync.saveDoc('announcements', newAnn.id, newAnn);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    firestoreSync.removeDoc('announcements', id);
  };

  const addEvent = (
    title: string,
    date: string,
    description: string,
    type: CalendarEventType,
    branchId?: string,
    branchName?: string
  ) => {
    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title,
      date,
      description,
      type,
      branchId,
      branchName,
    };
    setEvents((prev) => [...prev, newEvt]);
    firestoreSync.saveDoc('events', newEvt.id, newEvt);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    firestoreSync.removeDoc('events', id);
  };

  // =========================================================================
  // BIR-COMPLIANT POINT OF SALE (POS) ENTERPRISE ENGINE
  // =========================================================================

  const logPOSAudit = useCallback(
    (
      action: POSAuditLog['action'],
      details: string,
      referenceId?: string,
      branchId?: string
    ): POSAuditLog => {
      const bId = branchId || currentUser?.branchId || currentBranch?.id || 'b-legazpi';
      const branch = branches.find((b) => b.id === bId);
      const newLog: POSAuditLog = {
        id: `log-pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        branchId: bId,
        branchCode: branch?.code || `MB-${bId.toUpperCase()}`,
        user: currentUser?.name || registerShift.cashierName || 'Cashier',
        userRole: currentUser?.role === 'admin' ? 'HQ Admin' : 'Cashier',
        action,
        timestamp: new Date().toISOString(),
        details,
        deviceInfo:
          typeof navigator !== 'undefined'
            ? `${navigator.userAgent.slice(0, 45)} (VertexIS POS)`
            : 'VertexIS Sunmi V2 PRO POS Terminal',
        referenceId,
      };
      setPosAuditLogs((prev) => [newLog, ...prev]);
      firestoreSync.saveDoc('posAuditLogs', newLog.id, newLog);
      return newLog;
    },
    [branches, currentBranch, currentUser, registerShift]
  );

  const openRegisterShift = (
    cashierName: string,
    openingFloat: number,
    terminalId: string = 'POS-01'
  ) => {
    const branchId = currentUser?.branchId || currentBranch?.id || 'b-legazpi';
    setRegisterShift({
      isOpened: true,
      openedAt: new Date().toISOString(),
      cashierName,
      openingFloat,
      terminalId,
    });
    logPOSAudit(
      'LOGIN',
      `Register shift opened on terminal ${terminalId} with ₱${openingFloat.toLocaleString()} opening cash float by ${cashierName}.`,
      terminalId,
      branchId
    );
  };

  const processPOSTransaction = (payload: {
    items: { productId: string; quantity: number; unitPrice?: number }[];
    payments: POSPaymentDetail[];
    discountType: 'none' | 'pwd_senior' | 'promo10' | 'promo15' | 'custom';
    customDiscountAmount?: number;
    seniorPwdDetail?: POSSeniorPwdDetail;
    terminalId?: string;
    cashierName?: string;
    amountTendered?: number;
    customerName?: string;
  }): { receipt: BIRReceipt; change: number } => {
    const branchId = currentUser?.branchId || currentBranch?.id || 'b-legazpi';
    const branch = branches.find((b) => b.id === branchId) || currentBranch || branches[0];

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Transaction cart is empty. Add products before processing.');
    }

    // 1. Verify stock availability (Prevent negative inventory)
    for (const item of payload.items) {
      const prod = products.find((p) => p.id === item.productId);
      const inv = inventory.find((i) => i.branchId === branchId && i.productId === item.productId);
      const stock = inv ? inv.stock : 0;
      if (item.quantity > stock) {
        throw new Error(
          `Insufficient stock for ${prod?.flavor || 'item'}. Available: ${stock}, Requested: ${item.quantity}`
        );
      }
    }

    // 2. Determine sequential receipt number for this branch
    const branchIndex = Math.max(0, branches.findIndex((b) => b.id === branchId));
    const branchCodeNum = String(branchIndex + 1).padStart(3, '0');
    const year = new Date().getFullYear();
    const branchReceipts = birReceipts.filter((r) => r.branchId === branchId);
    const nextSeq = branchReceipts.length + 1;
    const receiptNumber = `BR${branchCodeNum}-${year}-${String(nextSeq).padStart(6, '0')}`;

    // 3. Compute Gross, Discount, Net, and VAT statutory breakdown
    let grossSales = 0;
    const transactionItems: POSTransactionItem[] = payload.items.map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      const unitPrice = it.unitPrice !== undefined ? it.unitPrice : prod?.price || 149;
      const grossAmount = it.quantity * unitPrice;
      grossSales += grossAmount;
      return {
        productId: it.productId,
        productName: prod?.name || 'Gourmet Marshmallow',
        flavor: prod?.flavor || 'Standard Flavor',
        barcode: `MB-${it.productId.toUpperCase()}-01`,
        quantity: it.quantity,
        unitPrice,
        grossAmount,
        discountAmount: 0,
        netAmount: grossAmount,
        isVatExempt: payload.discountType === 'pwd_senior',
      };
    });

    let discountAmount = 0;
    let vatableSales = 0;
    let vatAmount = 0;
    let vatExemptSales = 0;
    const zeroRatedSales = 0;

    if (payload.discountType === 'pwd_senior') {
      // Senior / PWD statutory 20% discount + VAT Exemption:
      // Net Base = Gross / 1.12
      // 20% Discount = Net Base * 0.20
      // Payable Net = Net Base - Discount
      const netBase = grossSales / 1.12;
      discountAmount = Math.round(netBase * 0.2);
      vatExemptSales = Math.round(netBase - discountAmount);
      vatableSales = 0;
      vatAmount = 0;
    } else if (payload.discountType === 'promo10') {
      discountAmount = Math.round(grossSales * 0.1);
      const net = grossSales - discountAmount;
      vatableSales = Math.round((net / 1.12) * 100) / 100;
      vatAmount = Math.round((net - vatableSales) * 100) / 100;
    } else if (payload.discountType === 'promo15') {
      discountAmount = Math.round(grossSales * 0.15);
      const net = grossSales - discountAmount;
      vatableSales = Math.round((net / 1.12) * 100) / 100;
      vatAmount = Math.round((net - vatableSales) * 100) / 100;
    } else if (payload.discountType === 'custom') {
      discountAmount = Math.min(grossSales, payload.customDiscountAmount || 0);
      const net = grossSales - discountAmount;
      vatableSales = Math.round((net / 1.12) * 100) / 100;
      vatAmount = Math.round((net - vatableSales) * 100) / 100;
    } else {
      const net = grossSales;
      vatableSales = Math.round((net / 1.12) * 100) / 100;
      vatAmount = Math.round((net - vatableSales) * 100) / 100;
    }

    const netSales = Math.max(0, grossSales - discountAmount);

    // 4. Validate Payments & Tender Calculation
    const totalPaid = payload.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const amountTendered = payload.amountTendered !== undefined ? payload.amountTendered : totalPaid;
    const hasCashPayment = payload.payments.some((p) => p.method === 'Cash');
    const change = hasCashPayment ? Math.max(0, amountTendered - netSales) : 0;

    // 5. Deduct inventory & record movement records
    const newMovements: InventoryMovementRecord[] = [];
    setInventory((prev) => {
      const nextInv = [...prev];
      for (const it of payload.items) {
        const idx = nextInv.findIndex(
          (i) => i.branchId === branchId && i.productId === it.productId
        );
        if (idx !== -1) {
          const prevStock = nextInv[idx].stock;
          const newStock = Math.max(0, prevStock - it.quantity);
          const updated = { ...nextInv[idx], stock: newStock };
          nextInv[idx] = updated;
          firestoreSync.saveDoc('inventory', updated.id, updated);

          const prod = products.find((p) => p.id === it.productId);
          const mov: InventoryMovementRecord = {
            id: `mov-${Date.now()}-${it.productId}`,
            branchId,
            productId: it.productId,
            productName: `${prod?.flavor || 'Flavor'} (${prod?.name || 'Product'})`,
            type: 'POS Sale',
            quantity: -it.quantity,
            previousStock: prevStock,
            newStock,
            referenceNo: receiptNumber,
            performedBy:
              payload.cashierName ||
              currentUser?.name ||
              registerShift.cashierName ||
              'Cashier',
            timestamp: new Date().toISOString(),
            notes: `Walk-in retail sale via ${payload.payments.map((p) => p.method).join(' + ')}`,
          };
          newMovements.push(mov);
          firestoreSync.saveDoc('inventoryMovements', mov.id, mov);
        }
      }
      return nextInv;
    });

    if (newMovements.length > 0) {
      setInventoryMovements((prev) => [...newMovements, ...prev]);
    }

    // 6. Build BIR Official Receipt object
    const nowIso = new Date().toISOString();
    const receipt: BIRReceipt = {
      id: `rec-${branchId}-${Date.now()}`,
      receiptNumber,
      sequenceNumber: nextSeq,
      branchId,
      branchCode: branch?.code || `MB-${branchId.toUpperCase()}`,
      branchName: branch?.name || 'Marsh Bites Branch',
      branchAddress: branch?.location || 'Naga City, Bicol',
      branchContact: branch?.contactNumber || '+63 917 554 1029',
      terminalId: payload.terminalId || registerShift.terminalId || 'POS-01',
      cashierId: currentUser?.id || `csh-${branchId}`,
      cashierName:
        payload.cashierName || currentUser?.name || registerShift.cashierName || 'Cashier',
      timestamp: nowIso,
      items: transactionItems,
      grossSales,
      discountType: payload.discountType,
      discountAmount,
      seniorPwdDetail: payload.seniorPwdDetail,
      netSales,
      vatableSales,
      vatAmount,
      vatExemptSales,
      zeroRatedSales,
      payments: payload.payments,
      totalAmountTendered: amountTendered,
      change,
      status: 'completed',
      syncedToCloud: true,
    };

    setBirReceipts((prev) => [receipt, ...prev]);
    firestoreSync.saveDoc('birReceipts', receipt.id, receipt);

    // 7. Add legacy Sales records for backward compatibility with analytics
    const createdSales: Sale[] = payload.items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId);
      const itemGross = it.quantity * (it.unitPrice || prod?.price || 149);
      const ratio = grossSales > 0 ? (grossSales - discountAmount) / grossSales : 1;
      const itemNet = Math.round(itemGross * ratio);
      const rawCustomerName = (payload.customerName || payload.seniorPwdDetail?.customerName || '').trim();
      const sale: Sale = {
        id: `sale-pos-${Date.now()}-${idx}`,
        branchId,
        productId: it.productId,
        productName: prod ? `${prod.flavor} (${prod.name})` : 'Gourmet Marshmallow Box',
        quantity: it.quantity,
        total: itemNet,
        date: nowIso,
        receiptPath: receiptNumber,
        paymentMethod: payload.payments.map((p) => p.method).join(' + '),
        amountTendered,
        change,
        discountAmount: Math.round(itemGross - itemNet),
        discountType: payload.discountType,
        customerName: rawCustomerName ? rawCustomerName : 'Walk-in Customer',
        cashierName: receipt.cashierName,
        source: 'VertexIS POS',
        status: 'completed',
      };
      firestoreSync.saveDoc('sales', sale.id, sale);
      return sale;
    });
    setSales((prev) => [...createdSales, ...prev]);

    // 8. Audit Log
    logPOSAudit(
      'SALE_PUNCH',
      `Official receipt #${receiptNumber} generated for ₱${netSales.toLocaleString()} (${transactionItems.length} items). Tendered: ₱${amountTendered.toLocaleString()}`,
      receiptNumber,
      branchId
    );

    return { receipt, change };
  };

  const voidPOSTransaction = (
    receiptId: string,
    managerPin: string,
    managerName: string,
    voidReason: string
  ): { success: boolean; message?: string; receipt?: BIRReceipt } => {
    // Validate manager PIN (accepts supervisor pins: "1234", "8888", "9999", "admin123", "branch123", "0000")
    const validPins = ['1234', '8888', '9999', 'admin123', 'branch123', '0000'];
    if (!managerPin || !validPins.includes(managerPin.trim())) {
      return { success: false, message: 'Invalid Branch Manager Supervisor PIN authorization.' };
    }

    const target = birReceipts.find((r) => r.id === receiptId || r.receiptNumber === receiptId);
    if (!target) {
      return { success: false, message: 'Receipt not found in transaction register.' };
    }

    if (target.status === 'voided') {
      return { success: false, message: 'Transaction has already been voided.' };
    }
    if (target.status === 'refunded') {
      return { success: false, message: 'Transaction has already been processed as a refund.' };
    }

    const nowIso = new Date().toISOString();
    const updatedReceipt: BIRReceipt = {
      ...target,
      status: 'voided',
      voidReason,
      voidedBy: managerName || 'Branch Manager',
      voidedAt: nowIso,
    };

    // 1. Restore inventory
    const restoredMovements: InventoryMovementRecord[] = [];
    setInventory((prev) => {
      const nextInv = [...prev];
      for (const it of target.items) {
        const idx = nextInv.findIndex(
          (i) => i.branchId === target.branchId && i.productId === it.productId
        );
        if (idx !== -1) {
          const prevStock = nextInv[idx].stock;
          const newStock = prevStock + it.quantity;
          const updated = { ...nextInv[idx], stock: newStock };
          nextInv[idx] = updated;
          firestoreSync.saveDoc('inventory', updated.id, updated);

          const mov: InventoryMovementRecord = {
            id: `mov-void-${Date.now()}-${it.productId}`,
            branchId: target.branchId,
            productId: it.productId,
            productName: `${it.flavor} (${it.productName})`,
            type: 'Void Return',
            quantity: it.quantity,
            previousStock: prevStock,
            newStock,
            referenceNo: target.receiptNumber,
            performedBy: managerName || 'Branch Manager',
            timestamp: nowIso,
            notes: `Inventory restored upon void of receipt #${target.receiptNumber}. Reason: ${voidReason}`,
          };
          restoredMovements.push(mov);
          firestoreSync.saveDoc('inventoryMovements', mov.id, mov);
        }
      }
      return nextInv;
    });

    if (restoredMovements.length > 0) {
      setInventoryMovements((prev) => [...restoredMovements, ...prev]);
    }

    // 2. Update BIR Receipts list
    setBirReceipts((prev) => prev.map((r) => (r.id === target.id ? updatedReceipt : r)));
    firestoreSync.saveDoc('birReceipts', updatedReceipt.id, updatedReceipt);

    // 3. Update legacy sales status
    setSales((prev) =>
      prev.map((s) => (s.receiptPath === target.receiptNumber ? { ...s, status: 'voided' } : s))
    );

    // 4. Audit Log
    logPOSAudit(
      'VOID_TRANSACTION',
      `Manager ${managerName} approved VOID of receipt #${target.receiptNumber} (Amount: ₱${target.netSales.toLocaleString()}). Reason: ${voidReason}`,
      target.receiptNumber,
      target.branchId
    );

    return { success: true, receipt: updatedReceipt };
  };

  const refundPOSTransaction = (
    receiptId: string,
    managerPin: string,
    managerName: string,
    refundReason: string,
    refundMethod: POSPaymentMethod,
    restockInventory: boolean,
    itemProductIds?: string[]
  ): { success: boolean; message?: string; refundAmount?: number } => {
    const validPins = ['1234', '8888', '9999', 'admin123', 'branch123', '0000'];
    if (!managerPin || !validPins.includes(managerPin.trim())) {
      return { success: false, message: 'Invalid Branch Manager Supervisor PIN authorization.' };
    }

    const target = birReceipts.find((r) => r.id === receiptId || r.receiptNumber === receiptId);
    if (!target) {
      return { success: false, message: 'Original receipt not found.' };
    }

    if (target.status === 'voided') {
      return { success: false, message: 'Cannot refund a voided transaction.' };
    }

    const nowIso = new Date().toISOString();
    const itemsToRefund =
      itemProductIds && itemProductIds.length > 0
        ? target.items.filter((i) => itemProductIds.includes(i.productId))
        : target.items;

    const refundAmount = itemsToRefund.reduce((sum, it) => sum + it.netAmount, 0);

    const updatedReceipt: BIRReceipt = {
      ...target,
      status: 'refunded',
      refundReason,
      refundedBy: managerName || 'Branch Manager',
      refundedAt: nowIso,
      refundAmount,
    };

    // Handle inventory restocking or disposal
    const refundMovements: InventoryMovementRecord[] = [];
    if (restockInventory) {
      setInventory((prev) => {
        const nextInv = [...prev];
        for (const it of itemsToRefund) {
          const idx = nextInv.findIndex(
            (i) => i.branchId === target.branchId && i.productId === it.productId
          );
          if (idx !== -1) {
            const prevStock = nextInv[idx].stock;
            const newStock = prevStock + it.quantity;
            const updated = { ...nextInv[idx], stock: newStock };
            nextInv[idx] = updated;
            firestoreSync.saveDoc('inventory', updated.id, updated);

            const mov: InventoryMovementRecord = {
              id: `mov-ref-${Date.now()}-${it.productId}`,
              branchId: target.branchId,
              productId: it.productId,
              productName: `${it.flavor} (${it.productName})`,
              type: 'Refund Return',
              quantity: it.quantity,
              previousStock: prevStock,
              newStock,
              referenceNo: target.receiptNumber,
              performedBy: managerName || 'Branch Manager',
              timestamp: nowIso,
              notes: `Items returned to sellable stock. Refund Reason: ${refundReason}`,
            };
            refundMovements.push(mov);
            firestoreSync.saveDoc('inventoryMovements', mov.id, mov);
          }
        }
        return nextInv;
      });
    } else {
      // Record as Damaged / Waste
      for (const it of itemsToRefund) {
        const mov: InventoryMovementRecord = {
          id: `mov-waste-${Date.now()}-${it.productId}`,
          branchId: target.branchId,
          productId: it.productId,
          productName: `${it.flavor} (${it.productName})`,
          type: 'Waste / Damaged',
          quantity: 0,
          previousStock: 0,
          newStock: 0,
          referenceNo: target.receiptNumber,
          performedBy: managerName || 'Branch Manager',
          timestamp: nowIso,
          notes: `Defective / Spoiled items discarded upon refund. Reason: ${refundReason}`,
        };
        refundMovements.push(mov);
        firestoreSync.saveDoc('inventoryMovements', mov.id, mov);
      }
    }

    if (refundMovements.length > 0) {
      setInventoryMovements((prev) => [...refundMovements, ...prev]);
    }

    setBirReceipts((prev) => prev.map((r) => (r.id === target.id ? updatedReceipt : r)));
    firestoreSync.saveDoc('birReceipts', updatedReceipt.id, updatedReceipt);

    setSales((prev) =>
      prev.map((s) => (s.receiptPath === target.receiptNumber ? { ...s, status: 'refunded' } : s))
    );

    logPOSAudit(
      'REFUND_TRANSACTION',
      `Manager ${managerName} approved REFUND of ₱${refundAmount.toLocaleString()} on receipt #${target.receiptNumber} via ${refundMethod}. Reason: ${refundReason}`,
      target.receiptNumber,
      target.branchId
    );

    return { success: true, refundAmount };
  };

  const getXReadingSummary = useCallback(
    (branchId?: string) => {
      const bId = branchId || currentUser?.branchId || currentBranch?.id || 'b-legazpi';
      const todayIsoPrefix = new Date().toISOString().split('T')[0];
      const receiptsToday = birReceipts.filter(
        (r) => r.branchId === bId && r.timestamp.startsWith(todayIsoPrefix)
      );

      let grossSales = 0;
      let netSales = 0;
      let vatableSales = 0;
      let vatAmount = 0;
      let vatExemptSales = 0;
      const zeroRatedSales = 0;
      let totalDiscounts = 0;
      let cashSales = 0;
      let digitalSales = 0;
      let cardSales = 0;
      let bankTransferSales = 0;
      let voidsCount = 0;
      let voidAmount = 0;
      let refundsCount = 0;
      let refundAmount = 0;

      receiptsToday.forEach((r) => {
        if (r.status === 'voided') {
          voidsCount++;
          voidAmount += r.netSales;
          return;
        }
        if (r.status === 'refunded') {
          refundsCount++;
          refundAmount += r.refundAmount || r.netSales;
        }

        grossSales += r.grossSales;
        netSales += r.netSales;
        vatableSales += r.vatableSales;
        vatAmount += r.vatAmount;
        vatExemptSales += r.vatExemptSales;
        totalDiscounts += r.discountAmount;

        r.payments.forEach((p) => {
          if (p.method === 'Cash') cashSales += p.amount;
          else if (p.method === 'GCash' || p.method === 'Maya') digitalSales += p.amount;
          else if (p.method === 'Debit Card' || p.method === 'Credit Card') cardSales += p.amount;
          else if (p.method === 'Bank Transfer') bankTransferSales += p.amount;
        });
      });

      const beginningReceiptNo =
        receiptsToday.length > 0 ? receiptsToday[receiptsToday.length - 1].receiptNumber : 'N/A';
      const endingReceiptNo = receiptsToday.length > 0 ? receiptsToday[0].receiptNumber : 'N/A';
      const openingFloat = registerShift.openingFloat;
      const expectedCash = openingFloat + cashSales;

      return {
        grossSales,
        netSales,
        vatableSales,
        vatAmount,
        vatExemptSales,
        zeroRatedSales,
        totalDiscounts,
        cashSales,
        digitalSales,
        cardSales,
        bankTransferSales,
        transactionsCount: receiptsToday.filter((r) => r.status === 'completed').length,
        voidsCount,
        voidAmount,
        refundsCount,
        refundAmount,
        beginningReceiptNo,
        endingReceiptNo,
        openingFloat,
        expectedCash,
      };
    },
    [birReceipts, currentBranch, currentUser, registerShift]
  );

  const closeShiftAndGenerateZReading = (payload: {
    cashierName: string;
    managerApprovedBy: string;
    actualCash: number;
    cashBreakdown?: CashDenominationCount[];
    notes?: string;
  }): ShiftClosingRecord => {
    const branchId = currentUser?.branchId || currentBranch?.id || 'b-legazpi';
    const branch = branches.find((b) => b.id === branchId) || currentBranch || branches[0];
    const summary = getXReadingSummary(branchId);

    const branchClosings = shiftClosings.filter((c) => c.branchId === branchId);
    const seq = branchClosings.length + 1;
    const branchIndex = Math.max(0, branches.findIndex((b) => b.id === branchId));
    const branchCodeNum = String(branchIndex + 1).padStart(3, '0');
    const year = new Date().getFullYear();
    const zReadingNumber = `ZR-BR${branchCodeNum}-${year}-${String(seq).padStart(5, '0')}`;

    const previousAccumulatedGrandTotal =
      branchClosings.length > 0 ? branchClosings[0].newAccumulatedGrandTotal : 154000;
    const todayAccumulatedSales = summary.netSales;
    const newAccumulatedGrandTotal = previousAccumulatedGrandTotal + todayAccumulatedSales;

    const cashVariance = payload.actualCash - summary.expectedCash;
    const nowIso = new Date().toISOString();

    const record: ShiftClosingRecord = {
      id: `zr-${branchId}-${Date.now()}`,
      zReadingNumber,
      sequenceNumber: seq,
      branchId,
      branchCode: branch?.code || `MB-${branchId.toUpperCase()}`,
      branchName: branch?.name || 'Marsh Bites Branch',
      terminalId: registerShift.terminalId || 'POS-01',
      cashierId: currentUser?.id || `csh-${branchId}`,
      cashierName:
        payload.cashierName || currentUser?.name || registerShift.cashierName || 'Cashier',
      openedAt: registerShift.openedAt || new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      closedAt: nowIso,
      openingFloat: summary.openingFloat,
      cashSales: summary.cashSales,
      digitalSales: summary.digitalSales,
      cardSales: summary.cardSales,
      bankTransferSales: summary.bankTransferSales,
      totalGrossSales: summary.grossSales,
      totalDiscounts: summary.totalDiscounts,
      totalVatAmount: summary.vatAmount,
      totalVatableSales: summary.vatableSales,
      totalVatExemptSales: summary.vatExemptSales,
      totalZeroRatedSales: summary.zeroRatedSales,
      totalNetSales: summary.netSales,
      totalTransactions: summary.transactionsCount,
      beginningReceiptNo: summary.beginningReceiptNo,
      endingReceiptNo: summary.endingReceiptNo,
      totalVoids: summary.voidsCount,
      totalVoidAmount: summary.voidAmount,
      totalRefunds: summary.refundsCount,
      totalRefundAmount: summary.refundAmount,
      expectedCash: summary.expectedCash,
      actualCash: payload.actualCash,
      cashVariance,
      cashBreakdown: payload.cashBreakdown || [],
      previousAccumulatedGrandTotal,
      todayAccumulatedSales,
      newAccumulatedGrandTotal,
      managerApprovedBy: payload.managerApprovedBy,
      notes: payload.notes,
      syncedToCloud: true,
    };

    setShiftClosings((prev) => [record, ...prev]);
    firestoreSync.saveDoc('shiftClosings', record.id, record);

    // Log End of day closing in POS audit
    logPOSAudit(
      'Z_READING_CLOSE',
      `Official End-of-Day Z-Reading #${zReadingNumber} filed by ${payload.cashierName}, approved by ${payload.managerApprovedBy}. Net Sales: ₱${summary.netSales.toLocaleString()}, Variance: ₱${cashVariance.toLocaleString()}`,
      zReadingNumber,
      branchId
    );

    return record;
  };

  const getReceiptsForBranch = useCallback(
    (bId: string) => birReceipts.filter((r) => r.branchId === bId),
    [birReceipts]
  );
  const getZReadingsForBranch = useCallback(
    (bId: string) => shiftClosings.filter((z) => z.branchId === bId),
    [shiftClosings]
  );
  const getInventoryMovementsForBranch = useCallback(
    (bId: string) => inventoryMovements.filter((m) => m.branchId === bId),
    [inventoryMovements]
  );
  const getPOSAuditLogsForBranch = useCallback(
    (bId: string) => posAuditLogs.filter((l) => l.branchId === bId),
    [posAuditLogs]
  );

  const resetToDefaultData = async () => {
    localStorage.removeItem(STORAGE_KEY);
    const u = generateInitialUsers();
    const b = INITIAL_BRANCHES;
    const p = INITIAL_PRODUCTS;
    const o = generateInitialOrders();
    const d = generateInitialDeliveries();
    const r = generateInitialReceivings();
    const inv = generateInitialInventory();
    const s = generateInitialSales();
    const a = generateInitialAnnouncements();
    const evts = generateInitialEvents();

    setUsers(u);
    setBranches(b);
    setProducts(p);
    setOrders(o);
    setDeliveries(d);
    setReceivings(r);
    setInventory(inv);
    setSales(s);
    setAnnouncements(a);
    setEvents(evts);
    setCurrentUser(u[0]);
    setThemeMode('light');

    // Force seed to Firestore
    await firestoreSync.seedInitialDatasetIfEmpty({
      users: u,
      branches: b,
      products: p,
      orders: o,
      deliveries: d,
      receivings: r,
      inventory: inv,
      sales: s,
      announcements: a,
      events: evts,
    });
  };

  const forceSyncCloud = useCallback(async () => {
    await firestoreSync.seedInitialDatasetIfEmpty({
      users,
      branches,
      products,
      orders,
      deliveries,
      receivings,
      inventory,
      sales,
      announcements,
      events,
    });
  }, [users, branches, products, orders, deliveries, receivings, inventory, sales, announcements, events]);

  // Queries & Analytics Helpers
  const getSalesForBranch = (bId: string) => sales.filter((s) => s.branchId === bId);
  const getOrdersForBranch = (bId: string) => orders.filter((o) => o.branchId === bId);
  const getInventoryForBranch = (bId: string) => inventory.filter((i) => i.branchId === bId);

  const branchRevenue = (bId: string) =>
    getSalesForBranch(bId).reduce((sum, s) => sum + s.total, 0);

  const branchStockCount = (bId: string) =>
    getInventoryForBranch(bId).reduce((sum, i) => sum + i.stock, 0);

  const averageDailyQuantityForProduct = (bId: string, pId: string, days: number = 14): number => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recent = sales.filter(
      (s) => s.branchId === bId && s.productId === pId && new Date(s.date) >= cutoff
    );
    const totalQty = recent.reduce((sum, s) => sum + s.quantity, 0);
    return totalQty / days;
  };

  const restockSuggestionsForBranch = (bId: string): RestockSuggestion[] => {
    const branchInv = getInventoryForBranch(bId);
    if (!branchInv.length) return [];

    const historyDays = 14;
    const forecastDays = 7;
    const safetyBuffer = 5;

    const suggestions: RestockSuggestion[] = [];

    branchInv.forEach((item) => {
      const avgDaily = averageDailyQuantityForProduct(bId, item.productId, historyDays);
      const expectedWeekly = avgDaily * forecastDays;
      const suggestedOrder = Math.ceil(expectedWeekly) + safetyBuffer - item.stock;

      if (suggestedOrder > 0) {
        let urgency: 'Urgent' | 'Review' | 'Monitor' = 'Monitor';
        if (suggestedOrder >= 20 || item.stock <= 3) urgency = 'Urgent';
        else if (suggestedOrder >= 10 || item.stock <= 8) urgency = 'Review';

        suggestions.push({
          productId: item.productId,
          productName: item.productName,
          currentStock: item.stock,
          averageDailyQuantity: avgDaily,
          expectedWeeklyDemand: expectedWeekly,
          suggestedOrderQuantity: suggestedOrder,
          urgency,
        });
      }
    });

    return suggestions.sort((a, b) => b.suggestedOrderQuantity - a.suggestedOrderQuantity);
  };

  const weeklyDemandAmountForBranch = (bId: string): number => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = sales.filter((s) => s.branchId === bId && new Date(s.date) >= cutoff);
    const sum = recent.reduce((acc, s) => acc + s.total, 0);
    return sum;
  };

  const demandForecastForBranch = (bId: string): string => {
    const branchSales = getSalesForBranch(bId);
    if (!branchSales.length) return 'No demand data';
    const amount = weeklyDemandAmountForBranch(bId);
    if (amount >= 5000) return 'High Demand (Peak Velocity)';
    if (amount >= 2500) return 'Growing Demand (Moderate)';
    return 'Stable Demand (Baseline)';
  };

  const adminRestockInsights = useMemo(() => {
    const list: { branchName: string; productName: string; suggested: number; urgency: string }[] = [];
    branches.forEach((b) => {
      const suggestions = restockSuggestionsForBranch(b.id);
      suggestions.forEach((s) => {
        list.push({
          branchName: b.name,
          productName: s.productName,
          suggested: s.suggestedOrderQuantity,
          urgency: s.urgency,
        });
      });
    });
    return list.sort((a, b) => b.suggested - a.suggested);
  }, [branches, inventory, sales]);

  const madeToOrderDemand = useMemo(() => {
    return products.map((prod) => {
      // Calculate demand from orders that are waiting approval, pending, or approved
      const activeOrders = orders.filter((o) => o.status !== 'rejected');
      let requestedUnits = 0;
      const pendingOrderIds: string[] = [];
      const branchSet = new Set<string>();

      activeOrders.forEach((o) => {
        const item = o.items.find((i) => i.productId === prod.id);
        if (item) {
          requestedUnits += item.quantity;
          pendingOrderIds.push(o.id);
          branchSet.add(o.branchId);
        }
      });

      const inProductionUnits = productionBatches
        .filter((b) => b.productId === prod.id && b.stage !== 'completed')
        .reduce((sum, b) => sum + b.quantity, 0);

      return {
        productId: prod.id,
        flavor: prod.flavor,
        unitPrice: prod.price,
        requestedUnits,
        inProductionUnits,
        readyBufferUnits: prod.adminStock,
        pendingOrderIds,
        affectedBranchCount: branchSet.size,
      };
    });
  }, [products, orders, productionBatches]);

  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.total, 0), [sales]);
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'waitingApproval' || o.status === 'pending').length,
    [orders]
  );

  return (
    <DataContext.Provider
      value={{
        users,
        branches,
        products,
        orders,
        deliveries,
        receivings,
        inventory,
        sales,
        announcements,
        events,
        productionBatches,
        // Branch Management Module extensions
        branchApplications,
        branchDocuments,
        branchAccounts,
        branchStatusHistory,
        branchAuditLogs,
        branchStatusCounts,
        currentUser,
        themeMode,
        currentBranch,
        syncState,
        toggleTheme,
        login,
        logout,
        switchUser,
        addBranch,
        submitBranchApplication,
        updateApplicationStatus,
        verifyDocument,
        approveBranchApplication,
        rejectBranchApplication,
        requestDocumentResubmission,
        uploadDocument,
        setBranchStatus,
        activateBranch,
        suspendBranch,
        reopenBranch,
        archiveBranch,
        softDeleteBranch,
        checkPermanentDeletionEligibility,
        permanentDeleteBranch,
        createBranchAccount,
        updateBranchAccount,
        resetBranchAccountPassword,
        toggleBranchAccountActive,
        sendAccountCredentials,
        logBranchAudit,
        getApplicationDocuments,
        getBranchDocuments,
        getBranchAccounts,
        getBranchStatusHistory,
        getBranchAuditLogs,
        addProduct,
        updateProduct,
        deleteProduct,
        logProduction,
        logProductionBatch,
        updateBatchStage,
        updateOrderProductionStage,
        produceForOrder,
        addProductionStock,
        createOrder,
        uploadPaymentProof,
        approveOrder,
        rejectOrder,
        deleteOrder,
        archiveOrder,
        createDelivery,
        updateDeliveryStatus,
        cancelDelivery,
        createReceiving,
        updateReceivingStatus,
        createReceivingInspection,
        updateStock,
        recordSale,
        recordMultiItemSale,
        importBatchSales,
        addAnnouncement,
        deleteAnnouncement,
        addEvent,
        deleteEvent,
        resetToDefaultData,
        forceSyncCloud,
        getBranch,
        getSalesForBranch,
        getOrdersForBranch,
        getInventoryForBranch,
        branchRevenue,
        branchStockCount,
        restockSuggestionsForBranch,
        demandForecastForBranch,
        weeklyDemandAmountForBranch,
        adminRestockInsights,
        madeToOrderDemand,
        totalRevenue,
        pendingOrdersCount,
        // BIR POS Module properties & methods
        birReceipts,
        shiftClosings,
        inventoryMovements,
        posAuditLogs,
        registerShift,
        openRegisterShift,
        processPOSTransaction,
        voidPOSTransaction,
        refundPOSTransaction,
        closeShiftAndGenerateZReading,
        getXReadingSummary,
        logPOSAudit,
        getReceiptsForBranch,
        getZReadingsForBranch,
        getInventoryMovementsForBranch,
        getPOSAuditLogsForBranch,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
