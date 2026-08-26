// Data Models for VertexIS - Marsh Bites Branch Management System

export type UserRole = 'admin' | 'branch';

export interface UserModel {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId?: string;
}

export type BranchStatus = 'Active' | 'Pending Activation' | 'Suspended' | 'Inactive' | 'Closed';

export type BranchBusinessType =
  | 'Franchise Kiosk'
  | 'Mall Inline Store'
  | 'Full Dine-In Branch'
  | 'Food Hall Booth'
  | 'Express Counter';

export interface Branch {
  id: string;
  name: string;
  code: string;
  businessType: BranchBusinessType | string;
  location: string;
  contactNumber: string;
  email: string;
  operatingHours: string;
  status: BranchStatus;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  managerGovId?: string;
  applicationId?: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  suspensionReason?: string;
}

export type DocumentType =
  | 'business_permit'
  | 'dti_registration'
  | 'bir_registration'
  | 'mayors_permit'
  | 'government_id'
  | 'lease_contract'
  | 'other';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'resubmission_requested';

export interface BranchDocument {
  id: string;
  branchId?: string;
  applicationId?: string;
  documentType: DocumentType;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  status: DocumentVerificationStatus;
  remarks?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type ApplicationStatus =
  | 'Pending Review'
  | 'Under Verification'
  | 'Approved'
  | 'Rejected'
  | 'Requires Revision';

export interface BranchApplication {
  id: string;
  branchName: string;
  branchCode: string;
  businessType: BranchBusinessType | string;
  address: string;
  contactNumber: string;
  email: string;
  operatingHours: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  managerGovId: string;
  documents: BranchDocument[];
  status: ApplicationStatus;
  reviewNotes?: string;
  rejectionReason?: string;
  revisionRemarks?: string;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedBranchId?: string;
}

export type BranchAccountRole = 'Branch Manager' | 'Staff' | 'Cashier' | 'Inventory Specialist';

export interface BranchAccount {
  id: string;
  branchId: string;
  branchName: string;
  username: string;
  temporaryPassword: string;
  fullName: string;
  email: string;
  phone?: string;
  role: BranchAccountRole;
  permissions: string[];
  isActive: boolean;
  credentialsSent: boolean;
  credentialsSentAt?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BranchStatusHistory {
  id: string;
  branchId: string;
  branchName: string;
  previousStatus: BranchStatus;
  newStatus: BranchStatus;
  reason: string;
  changedBy: string;
  timestamp: string;
}

export interface BranchAuditLog {
  id: string;
  branchId?: string;
  branchName?: string;
  action: string;
  user: string;
  timestamp: string;
  remarks: string;
  metadata?: Record<string, any>;
}

export interface Product {
  id: string;
  name: string;
  flavor: string;
  price: number; // POS Retail Selling Price (SRP) e.g. ₱149
  wholesalePrice?: number; // Partner Wholesale Ordering Price e.g. ₱100
  adminStock: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pending' | 'waitingApproval' | 'approved' | 'rejected' | 'dispatched' | 'completed';
export type ProductionStage = 'queued' | 'in_kettle' | 'curing' | 'packaged' | 'ready_for_dispatch';

export type DispatchMethod = 'company_driver' | 'jt_express';

export interface Order {
  id: string;
  branchId: string;
  branchName: string;
  status: OrderStatus;
  productionStage?: ProductionStage;
  batchCode?: string;
  estimatedReadyDate?: string;
  totalAmount: number;
  createdAt: string; // ISO string
  items: OrderItem[];
  proofImagePath?: string;
  rejectionReason?: string;
  packageName?: string;
  packageTier?: 'silver' | 'gold' | 'platinum';
  isArchived?: boolean;
  isDispatched?: boolean;
  dispatchMethod?: DispatchMethod;
  waybillNumber?: string;
  trackingNumber?: string;
  receivedAt?: string;
  completedAt?: string;
  paymentMethod?: DigitalPaymentMethod | string;
  paymentStatus?: PaymentGatewayStatus;
  paymentIntentId?: string;
  paymentReference?: string;
  paymentCompletedAt?: string;
}

export type BatchStage = 'in_kettle' | 'curing' | 'packaged' | 'completed';

export interface ProductionBatch {
  id: string;
  batchCode: string;
  productId: string;
  productFlavor: string;
  quantity: number;
  targetOrderId?: string;
  targetBranchName?: string;
  stage: BatchStage;
  chefName: string;
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export type PaymentGatewayStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED';

export type DigitalPaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'cash';

export interface PaymentIntent {
  id: string; // e.g. pi_gc_8492019
  orderId: string;
  amount: number;
  currency: 'PHP';
  paymentMethod: DigitalPaymentMethod;
  provider: 'paymongo' | 'maya_business' | 'instapay' | 'direct_bank';
  status: PaymentGatewayStatus;
  checkoutUrl: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  referenceNumber: string;
  createdAt: string;
  expiresAt: string;
  description: string;
  feeAmount?: number;
  paidAt?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
  };
}

export interface PaymentWebhookEvent {
  id: string;
  type: 'payment.paid' | 'payment.failed' | 'payment.expired';
  data: {
    paymentIntentId: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string;
    paidAt: string;
  };
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  branchId: string;
  proofImagePath: string;
  status: PaymentStatus;
  paymentMethod?: DigitalPaymentMethod | string;
  paymentIntentId?: string;
  referenceNumber?: string;
  verifiedAt?: string;
}

export type DeliveryStatus = 'pending' | 'inTransit' | 'delivered' | 'canceled';

export interface Delivery {
  id: string;
  orderId: string;
  branchId: string;
  address: string;
  status: DeliveryStatus;
  scheduledAt: string;
  deliveredAt?: string;
  courierName?: string;
  dispatchMethod?: DispatchMethod;
  trackingNumber?: string;
  waybillNumber?: string;
  jtSortingCode?: string;
  driverName?: string;
  vehiclePlateNo?: string;
  receiverContact?: string;
  receiverPhone?: string;
  weightKg?: number;
  notes?: string;
}

export interface InterBranchTransfer {
  id: string; // e.g. IBT-2026-0001
  sourceBranchId: string;
  sourceBranchName: string;
  targetBranchId: string;
  targetBranchName: string;
  targetAddress: string;
  items: { productId: string; productName: string; quantity: number }[];
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'rejected' | 'canceled';
  dispatchMethod?: DispatchMethod;
  courierName?: string;
  waybillNumber?: string;
  trackingNumber?: string;
  jtSortingCode?: string;
  driverName?: string;
  vehiclePlateNo?: string;
  reason?: string;
  createdAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export type ReceivingStatus = 'pending' | 'received' | 'damaged' | 'returned';

export interface Receiving {
  id: string;
  deliveryId: string;
  orderId: string;
  branchId: string;
  status: ReceivingStatus;
  createdAt: string;
  receivedAt?: string;
  receiverName?: string;
  conditionNotes?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  stock: number;
}

export interface RestockSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailyQuantity: number;
  expectedWeeklyDemand: number;
  suggestedOrderQuantity: number;
  urgency: 'Urgent' | 'Review' | 'Monitor';
}

export interface Sale {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  date: string;
  receiptPath?: string;
  paymentMethod?: 'Cash' | 'GCash' | 'Maya' | 'Card' | 'Split Payment' | string;
  amountTendered?: number;
  change?: number;
  discountAmount?: number;
  discountType?: string;
  customerName?: string;
  cashierName?: string;
  source?: 'VertexIS POS' | 'Offline Batch Import' | string;
  status?: 'completed' | 'voided' | 'refunded';
}

// ----------------------------------------------------
// BIR-Compliant Point of Sale (POS) Enterprise Models
// ----------------------------------------------------

export type POSPaymentMethod =
  | 'Cash'
  | 'GCash'
  | 'Maya'
  | 'Bank Transfer'
  | 'Debit Card'
  | 'Credit Card';

export interface POSPaymentDetail {
  method: POSPaymentMethod;
  amount: number;
  referenceNumber?: string;
  approvalCode?: string;
  bankName?: string;
  cardLast4?: string;
}

export interface POSSeniorPwdDetail {
  idNumber: string;
  customerName: string;
  type: 'Senior Citizen' | 'PWD';
  bookletNumber?: string;
}

export interface POSTransactionItem {
  productId: string;
  productName: string;
  flavor: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  isVatExempt?: boolean;
}

export interface BIRReceipt {
  id: string;
  receiptNumber: string; // e.g. BR001-2026-000001
  sequenceNumber: number;
  branchId: string;
  branchCode: string;
  branchName: string;
  branchAddress: string;
  branchContact: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  timestamp: string; // ISO 8601
  items: POSTransactionItem[];
  grossSales: number;
  discountType: 'none' | 'pwd_senior' | 'promo10' | 'promo15' | 'custom';
  discountAmount: number;
  seniorPwdDetail?: POSSeniorPwdDetail;
  netSales: number;
  vatableSales: number;
  vatAmount: number; // 12% statutory VAT
  vatExemptSales: number; // SC / PWD exempt portions
  zeroRatedSales: number;
  payments: POSPaymentDetail[];
  totalAmountTendered: number;
  change: number;
  status: 'completed' | 'voided' | 'refunded';
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  refundReason?: string;
  refundedBy?: string;
  refundedAt?: string;
  refundAmount?: number;
  syncedToCloud: boolean;
}

export interface CashDenominationCount {
  denomination: number; // e.g. 1000, 500, 200, 100, 50, 20, 10, 5, 1
  count: number;
  total: number;
}

export interface ShiftClosingRecord {
  id: string;
  zReadingNumber: string; // e.g. ZR-BR001-2026-00001
  sequenceNumber: number;
  branchId: string;
  branchCode: string;
  branchName: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt: string;
  openingFloat: number;
  cashSales: number;
  digitalSales: number;
  cardSales: number;
  bankTransferSales: number;
  totalGrossSales: number;
  totalDiscounts: number;
  totalVatAmount: number;
  totalVatableSales: number;
  totalVatExemptSales: number;
  totalZeroRatedSales: number;
  totalNetSales: number;
  totalTransactions: number;
  beginningReceiptNo: string;
  endingReceiptNo: string;
  totalVoids: number;
  totalVoidAmount: number;
  totalRefunds: number;
  totalRefundAmount: number;
  expectedCash: number;
  actualCash: number;
  cashVariance: number; // actualCash - expectedCash (negative = shortage, positive = overage)
  cashBreakdown: CashDenominationCount[];
  previousAccumulatedGrandTotal: number;
  todayAccumulatedSales: number;
  newAccumulatedGrandTotal: number;
  managerApprovedBy: string;
  notes?: string;
  syncedToCloud: boolean;
}

export interface InventoryMovementRecord {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  type:
    | 'Stock In'
    | 'Stock Out'
    | 'POS Sale'
    | 'Void Return'
    | 'Refund Return'
    | 'Waste / Damaged'
    | 'Transfer In'
    | 'Transfer Out'
    | 'Physical Count Adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNo: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface POSAuditLog {
  id: string;
  branchId: string;
  branchCode: string;
  user: string;
  userRole: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'SALE_PUNCH'
    | 'RECEIPT_PRINT'
    | 'VOID_TRANSACTION'
    | 'REFUND_TRANSACTION'
    | 'X_READING'
    | 'Z_READING_CLOSE'
    | 'DRAWER_KICK'
    | 'DISCOUNT_APPLIED'
    | 'STOCK_ADJUST'
    | 'OFFLINE_SYNC';
  timestamp: string;
  details: string;
  deviceInfo: string;
  referenceId?: string;
  ipAddress?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export type CalendarEventType = 'task' | 'appointment';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  type: CalendarEventType;
  branchId?: string;
  branchName?: string;
}
