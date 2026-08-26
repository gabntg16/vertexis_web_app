import QRCode from 'qrcode';
import {
  DigitalPaymentMethod,
  PaymentIntent,
  PaymentGatewayStatus,
  PaymentWebhookEvent,
  POSPaymentMethod,
} from '../types';

// ============================================================================
// COMMISSARY CORPORATE BANK & WALLET CONFIGURATION
// ============================================================================
export const COMMISSARY_BANK_ACCOUNTS = [
  {
    bankName: 'BDO Unibank (Primary Commissary Collection)',
    shortName: 'BDO',
    accountName: 'THE MARSH BITES CONFECTIONERY INC.',
    accountNumber: '0048-2918-4491',
    accountType: 'Corporate Current / Checking',
    branch: 'Naga City - Peñafrancia Ave Branch',
    instapaySupported: true,
    pesonetSupported: true,
  },
  {
    bankName: 'Bank of the Philippine Islands (BPI)',
    shortName: 'BPI',
    accountName: 'THE MARSH BITES CONFECTIONERY INC.',
    accountNumber: '0942-8812-39',
    accountType: 'Corporate Current',
    branch: 'Naga City - Magsaysay Branch',
    instapaySupported: true,
    pesonetSupported: true,
  },
  {
    bankName: 'UnionBank of the Philippines',
    shortName: 'UnionBank',
    accountName: 'THE MARSH BITES CONFECTIONERY INC.',
    accountNumber: '1098-4490-2819',
    accountType: 'Corporate Business Account',
    branch: 'Bicol Regional Hub',
    instapaySupported: true,
    pesonetSupported: true,
  },
];

export const COMMISSARY_DIGITAL_WALLETS = {
  gcash: {
    merchantName: 'The Marsh Bites Naga Commissary',
    walletNumber: '0917-884-2104',
    merchantId: 'MID-MB-GCASH-49102',
    qrPhSupported: true,
  },
  maya: {
    merchantName: 'The Marsh Bites Naga Commissary',
    walletNumber: '0917-884-2104',
    merchantId: 'MID-MB-MAYA-99281',
    qrPhSupported: true,
  },
};

// Check sandbox/mock payments toggle
export const isMockPaymentMode = (): boolean => {
  // Support both Vite and standard CRA / Node env flags
  const viteMock = import.meta.env.VITE_USE_MOCK_PAYMENTS;
  const legacyMock = typeof process !== 'undefined' && process.env ? process.env.REACT_APP_USE_MOCK_PAYMENTS : undefined;
  
  if (viteMock === 'false' || legacyMock === 'false') return false;
  return true; // Default to true in sandbox environment for seamless offline/local testing
};

// In-Memory & LocalStorage Intent Registry
const INTENTS_STORAGE_KEY = 'vertexis_payment_intents_v1';

function getStoredIntents(): Record<string, PaymentIntent> {
  try {
    const raw = localStorage.getItem(INTENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredIntent(intent: PaymentIntent) {
  try {
    const existing = getStoredIntents();
    existing[intent.id] = intent;
    localStorage.setItem(INTENTS_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('[PaymentGateway] Could not persist intent to storage', err);
  }
}

// Payment Event Listeners (for real-time UI updates upon webhook triggers)
type WebhookListener = (intent: PaymentIntent) => void;
const webhookListeners: Set<WebhookListener> = new Set();

export const subscribeToPaymentUpdates = (listener: WebhookListener) => {
  webhookListeners.add(listener);
  return () => {
    webhookListeners.delete(listener);
  };
};

function notifyListeners(intent: PaymentIntent) {
  webhookListeners.forEach((fn) => {
    try {
      fn(intent);
    } catch (e) {
      console.error('[PaymentGateway] Listener error', e);
    }
  });
}

// ============================================================================
// PAYMENT GATEWAY SERVICE CLASS
// ============================================================================
export class PaymentGatewayService {
  /**
   * Generates a BIR / Philippine e-wallet compliant reference number
   */
  public generateReferenceNumber(method: DigitalPaymentMethod | POSPaymentMethod): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();

    switch (method) {
      case 'gcash':
      case 'GCash':
        return `GC-${dateStr}-${randomHex}`;
      case 'maya':
      case 'Maya':
        return `MY-${dateStr}-${randomHex}`;
      case 'bank_transfer':
      case 'Bank Transfer':
        return `BT-INP-${dateStr.slice(4)}-${randomHex}`;
      case 'Debit Card':
      case 'Credit Card':
        return `CC-AUTH-${randomHex}`;
      default:
        return `REF-${dateStr}-${randomHex}`;
    }
  }

  public generateSampleReferenceNumber(method: DigitalPaymentMethod | POSPaymentMethod): string {
    return this.generateReferenceNumber(method);
  }

  /**
   * Generates an EMVCo/QR Ph payload string for GCash / Maya scanning
   */
  private generateQRPhPayload(
    amount: number,
    referenceNumber: string,
    merchantName: string = 'THE MARSH BITES PH'
  ): string {
    // Standardized QR Ph payload format
    return `00020101021226580014ph.payment.qr0111${referenceNumber}520454995303608540${amount.toFixed(2).length}${amount.toFixed(2)}5802PH59${merchantName.length}${merchantName}6009NAGA CITY62190715${referenceNumber}6304`;
  }

  /**
   * Creates a new PaymentIntent with QR Code and Checkout URL
   */
  public async createPaymentIntent(
    orderId: string,
    amount: number,
    paymentMethod: DigitalPaymentMethod,
    metadata?: { branchName?: string; description?: string; customerEmail?: string; customerName?: string }
  ): Promise<PaymentIntent> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes window
    const referenceNumber = this.generateReferenceNumber(paymentMethod);
    const prefix = paymentMethod === 'gcash' ? 'pi_gc' : paymentMethod === 'maya' ? 'pi_my' : 'pi_bt';
    const intentId = `${prefix}_${orderId}_${Date.now().toString().slice(-6)}`;

    let provider: PaymentIntent['provider'] = 'paymongo';
    if (paymentMethod === 'maya') provider = 'maya_business';
    if (paymentMethod === 'bank_transfer') provider = 'instapay';
    if (paymentMethod === 'cash') provider = 'direct_bank';

    const branchDesc = metadata?.branchName ? ` for ${metadata.branchName}` : '';
    const description = metadata?.description || `The Marsh Bites Requisition #${orderId}${branchDesc}`;

    // Checkout URL (PayMongo / Maya Business API simulation)
    const checkoutUrl =
      paymentMethod === 'gcash'
        ? `https://pm.link/paymongo/checkout/${intentId}?ref=${referenceNumber}&amt=${amount}`
        : paymentMethod === 'maya'
        ? `https://pg.maya.ph/checkout/${intentId}?ref=${referenceNumber}&amt=${amount}`
        : `https://instapay.bdo.com.ph/transfer?acct=0048-2918-4491&ref=${referenceNumber}&amt=${amount}`;

    // Generate Dynamic QR Code
    const qrCodeData = this.generateQRPhPayload(amount, referenceNumber, 'THE MARSH BITES COMMISSARY');
    let qrCodeUrl = '';

    try {
      qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
        width: 320,
        margin: 2,
        color: {
          dark: paymentMethod === 'gcash' ? '#005CEE' : paymentMethod === 'maya' ? '#00A344' : '#171717',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (err) {
      console.warn('[PaymentGateway] QR generation fallback', err);
      qrCodeUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif">QR Ph - ₱${amount.toLocaleString()}</text></svg>`;
    }

    const intent: PaymentIntent = {
      id: intentId,
      orderId,
      amount,
      currency: 'PHP',
      paymentMethod,
      provider,
      status: 'PENDING',
      checkoutUrl,
      qrCodeUrl,
      qrCodeData,
      referenceNumber,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      description,
      feeAmount: 0,
      bankDetails:
        paymentMethod === 'bank_transfer'
          ? {
              bankName: 'BDO Unibank (Central Commissary Account)',
              accountName: 'THE MARSH BITES CONFECTIONERY INC.',
              accountNumber: '0048-2918-4491',
              branch: 'Naga City Peñafrancia Branch',
            }
          : undefined,
    };

    saveStoredIntent(intent);
    return intent;
  }

  /**
   * Checks the status of a Payment Intent
   */
  public async checkPaymentStatus(
    paymentIntentId: string
  ): Promise<{ status: PaymentGatewayStatus; paidAt?: string; intent?: PaymentIntent }> {
    const intents = getStoredIntents();
    const intent = intents[paymentIntentId];

    if (!intent) {
      return { status: 'FAILED' };
    }

    // Check expiration
    if (intent.status === 'PENDING' && new Date(intent.expiresAt).getTime() < Date.now()) {
      intent.status = 'EXPIRED';
      saveStoredIntent(intent);
    }

    return {
      status: intent.status,
      paidAt: intent.paidAt,
      intent,
    };
  }

  /**
   * Webhook Handler: processes incoming webhook event from PayMongo / Maya Gateway
   */
  public processWebhook(event: PaymentWebhookEvent): { success: boolean; message: string; updatedIntent?: PaymentIntent } {
    const { paymentIntentId, paidAt } = event.data;
    const intents = getStoredIntents();
    const intent = intents[paymentIntentId];

    if (!intent) {
      return { success: false, message: `Intent ${paymentIntentId} not found.` };
    }

    if (event.type === 'payment.paid') {
      intent.status = 'SUCCESSFUL';
      intent.paidAt = paidAt || new Date().toISOString();
      saveStoredIntent(intent);
      notifyListeners(intent);
      return { success: true, message: `Payment intent ${paymentIntentId} marked as SUCCESSFUL`, updatedIntent: intent };
    } else if (event.type === 'payment.failed') {
      intent.status = 'FAILED';
      saveStoredIntent(intent);
      notifyListeners(intent);
      return { success: true, message: `Payment intent ${paymentIntentId} marked as FAILED`, updatedIntent: intent };
    } else if (event.type === 'payment.expired') {
      intent.status = 'EXPIRED';
      saveStoredIntent(intent);
      notifyListeners(intent);
      return { success: true, message: `Payment intent ${paymentIntentId} expired`, updatedIntent: intent };
    }

    return { success: false, message: `Unhandled event type: ${event.type}` };
  }

  /**
   * Sandbox Simulator: Simulates a customer approving payment in GCash / Maya app
   */
  public async simulatePaymentApproval(paymentIntentId: string): Promise<PaymentIntent> {
    const intents = getStoredIntents();
    const intent = intents[paymentIntentId];
    if (!intent) {
      throw new Error(`Payment intent ${paymentIntentId} not found.`);
    }

    // Simulate network latency (400ms)
    await new Promise((res) => setTimeout(res, 400));

    const paidAt = new Date().toISOString();
    intent.status = 'SUCCESSFUL';
    intent.paidAt = paidAt;
    saveStoredIntent(intent);

    this.processWebhook({
      id: `evt_${Date.now()}`,
      type: 'payment.paid',
      data: {
        paymentIntentId: intent.id,
        orderId: intent.orderId,
        amount: intent.amount,
        paymentMethod: intent.paymentMethod,
        referenceNumber: intent.referenceNumber,
        paidAt,
      },
      createdAt: paidAt,
    });

    return intent;
  }

  /**
   * Sandbox Simulator: Simulates payment cancellation or timeout
   */
  public async simulatePaymentFailure(paymentIntentId: string): Promise<PaymentIntent> {
    const intents = getStoredIntents();
    const intent = intents[paymentIntentId];
    if (!intent) {
      throw new Error(`Payment intent ${paymentIntentId} not found.`);
    }

    intent.status = 'FAILED';
    saveStoredIntent(intent);

    this.processWebhook({
      id: `evt_fail_${Date.now()}`,
      type: 'payment.failed',
      data: {
        paymentIntentId: intent.id,
        orderId: intent.orderId,
        amount: intent.amount,
        paymentMethod: intent.paymentMethod,
        referenceNumber: intent.referenceNumber,
        paidAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    return intent;
  }

  /**
   * Generates a Dynamic QR code for the POS Register (Customer Display / Cashier Tablet)
   */
  public async generateDynamicPOSQr(
    amount: number,
    method: 'GCash' | 'Maya' | 'Bank Transfer',
    receiptNumber?: string
  ): Promise<{ qrDataUrl: string; referenceNumber: string; checkoutUrl: string }> {
    const ref = this.generateReferenceNumber(method);
    const merchant = method === 'GCash' ? 'THE MARSH BITES GCASH POS' : 'THE MARSH BITES MAYA POS';
    const payload = this.generateQRPhPayload(amount, ref, merchant);

    const darkColor = method === 'GCash' ? '#005CEE' : method === 'Maya' ? '#00A344' : '#111827';
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 1,
      color: {
        dark: darkColor,
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    const checkoutUrl =
      method === 'GCash'
        ? `https://pm.link/paymongo/pos-checkout?ref=${ref}&amount=${amount}`
        : `https://pg.maya.ph/pos-checkout?ref=${ref}&amount=${amount}`;

    return {
      qrDataUrl,
      referenceNumber: ref,
      checkoutUrl,
    };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
