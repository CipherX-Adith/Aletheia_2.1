// ─── Organization Types ───────────────────────────────────────────────────────
export const ORG_TYPES = {
  EXPORTER: 'EXPORTER',
  BUYER: 'BUYER',
  INVESTOR: 'INVESTOR',
  BANK: 'BANK',
  NBFC: 'NBFC',
  INSURER: 'INSURER',
  LOGISTICS: 'LOGISTICS',
  EXPORT_COUNCIL: 'EXPORT_COUNCIL',
};

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_MEMBER: 'ORG_MEMBER',
  VERIFIER: 'VERIFIER',
};

// ─── KYB / Verification Status ────────────────────────────────────────────────
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  INFO_REQUESTED: 'INFO_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// ─── Trade Passport Status ────────────────────────────────────────────────────
export const PASSPORT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REVOKED: 'REVOKED',
};

// ─── Receivable Status ────────────────────────────────────────────────────────
export const RECEIVABLE_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_VERIFICATION: 'UNDER_VERIFICATION',
  VERIFIED: 'VERIFIED',
  TOKENIZED: 'TOKENIZED',
  LISTED: 'LISTED',
  FUNDED: 'FUNDED',
  SETTLED: 'SETTLED',
  DEFAULTED: 'DEFAULTED',
  CANCELLED: 'CANCELLED',
};

// ─── Document Types ───────────────────────────────────────────────────────────
export const DOCUMENT_TYPES = {
  COMMERCIAL_INVOICE: 'COMMERCIAL_INVOICE',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  BILL_OF_LADING: 'BILL_OF_LADING',
  SHIPPING_BILL: 'SHIPPING_BILL',
  PACKING_LIST: 'PACKING_LIST',
  INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
  LETTER_OF_CREDIT: 'LETTER_OF_CREDIT',
  BANK_GUARANTEE: 'BANK_GUARANTEE',
  KYB_DOCUMENT: 'KYB_DOCUMENT',
  OTHER: 'OTHER',
};

// ─── Investment Status ────────────────────────────────────────────────────────
export const INVESTMENT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SETTLED: 'SETTLED',
  DEFAULTED: 'DEFAULTED',
  CANCELLED: 'CANCELLED',
};

// ─── Settlement Status ────────────────────────────────────────────────────────
export const SETTLEMENT_STATUS = {
  INITIATED: 'INITIATED',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  DISTRIBUTED: 'DISTRIBUTED',
  FAILED: 'FAILED',
};

// ─── Exchange Listing Status ──────────────────────────────────────────────────
export const LISTING_STATUS = {
  ACTIVE: 'ACTIVE',
  FUNDED: 'FUNDED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  KYB_APPROVED: 'KYB_APPROVED',
  KYB_REJECTED: 'KYB_REJECTED',
  KYB_INFO_REQUESTED: 'KYB_INFO_REQUESTED',
  RECEIVABLE_VERIFIED: 'RECEIVABLE_VERIFIED',
  RECEIVABLE_LISTED: 'RECEIVABLE_LISTED',
  INVESTMENT_RECEIVED: 'INVESTMENT_RECEIVED',
  RECEIVABLE_FUNDED: 'RECEIVABLE_FUNDED',
  SETTLEMENT_INITIATED: 'SETTLEMENT_INITIATED',
  SETTLEMENT_COMPLETED: 'SETTLEMENT_COMPLETED',
  GENERAL: 'GENERAL',
};

// ─── Platform Fees ────────────────────────────────────────────────────────────
export const FEES = {
  MARKETPLACE_FEE_PERCENT: 0.5, // 0.5% on funding amount
  SETTLEMENT_FEE_PERCENT: 0.25, // 0.25% on settlement
  EARLY_PAYMENT_DISCOUNT_MAX: 15, // max 15% discount
};

export default {
  ORG_TYPES, USER_ROLES, VERIFICATION_STATUS, PASSPORT_STATUS,
  RECEIVABLE_STATUS, DOCUMENT_TYPES, INVESTMENT_STATUS,
  SETTLEMENT_STATUS, LISTING_STATUS, NOTIFICATION_TYPES, FEES,
};
