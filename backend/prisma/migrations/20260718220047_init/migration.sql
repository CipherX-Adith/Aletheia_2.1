-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'ORG_ADMIN', 'ORG_MEMBER', 'VERIFIER');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('EXPORTER', 'BUYER', 'INVESTOR', 'BANK', 'NBFC', 'INSURER', 'LOGISTICS', 'EXPORT_COUNCIL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED', 'TOKENIZED', 'LISTED', 'FUNDED', 'SETTLED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('COMMERCIAL_INVOICE', 'PURCHASE_ORDER', 'BILL_OF_LADING', 'SHIPPING_BILL', 'PACKING_LIST', 'INSURANCE_CERTIFICATE', 'LETTER_OF_CREDIT', 'BANK_GUARANTEE', 'KYB_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'SETTLED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('INITIATED', 'PROCESSING', 'CONFIRMED', 'DISTRIBUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'FUNDED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('KYB_APPROVED', 'KYB_REJECTED', 'KYB_INFO_REQUESTED', 'RECEIVABLE_VERIFIED', 'RECEIVABLE_LISTED', 'INVESTMENT_RECEIVED', 'RECEIVABLE_FUNDED', 'SETTLEMENT_INITIATED', 'SETTLEMENT_COMPLETED', 'GENERAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ORG_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "orgType" "OrgType" NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ORG_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradePassport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "status" "PassportStatus" NOT NULL DEFAULT 'DRAFT',
    "kybStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successfulTrades" INTEGER NOT NULL DEFAULT 0,
    "defaultCount" INTEGER NOT NULL DEFAULT 0,
    "avgSettlementDays" DOUBLE PRECISION,
    "certifications" TEXT,
    "activeSince" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradePassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradePassportEvent" (
    "id" TEXT NOT NULL,
    "tradePassportId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradePassportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "usdcBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xlmBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "txHash" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'USDC',
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL,
    "receivableNumber" TEXT NOT NULL,
    "exporterId" TEXT NOT NULL,
    "buyerId" TEXT,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "discountRate" DOUBLE PRECISION,
    "fundingAmount" DOUBLE PRECISION,
    "commodity" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "incoterms" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerCountry" TEXT NOT NULL,
    "description" TEXT,
    "ipfsHash" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "tokenizedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivableDocument" (
    "id" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReceivableDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "receivableId" TEXT,
    "type" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "requestedInfoAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationStep" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWTToken" (
    "id" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "assetIssuer" TEXT NOT NULL,
    "totalSupply" DOUBLE PRECISION NOT NULL,
    "availableSupply" DOUBLE PRECISION NOT NULL,
    "tokenPrice" DOUBLE PRECISION NOT NULL,
    "stellarAssetId" TEXT,
    "mintTxHash" TEXT,
    "burnTxHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mintedAt" TIMESTAMP(3),
    "burntAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RWTToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeListing" (
    "id" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minInvestment" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "maxInvestment" DOUBLE PRECISION,
    "yieldRate" DOUBLE PRECISION NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "investorOrgId" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokensBought" DOUBLE PRECISION NOT NULL,
    "tokenPrice" DOUBLE PRECISION NOT NULL,
    "expectedYield" DOUBLE PRECISION NOT NULL,
    "expectedReturn" DOUBLE PRECISION NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'PENDING',
    "stellarTxHash" TEXT,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'INITIATED',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "stellarTxHash" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementDistribution" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "yield" DOUBLE PRECISION NOT NULL,
    "stellarTxHash" TEXT,
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "receivableId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "factors" JSONB,
    "aiAnalysis" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Organization_orgType_idx" ON "Organization"("orgType");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TradePassport_organizationId_key" ON "TradePassport"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TradePassport_passportNumber_key" ON "TradePassport"("passportNumber");

-- CreateIndex
CREATE INDEX "TradePassport_status_idx" ON "TradePassport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_organizationId_key" ON "Wallet"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_publicKey_key" ON "Wallet"("publicKey");

-- CreateIndex
CREATE INDEX "Wallet_publicKey_idx" ON "Wallet"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_txHash_key" ON "WalletTransaction"("txHash");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_txHash_idx" ON "WalletTransaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Receivable_receivableNumber_key" ON "Receivable"("receivableNumber");

-- CreateIndex
CREATE INDEX "Receivable_exporterId_idx" ON "Receivable"("exporterId");

-- CreateIndex
CREATE INDEX "Receivable_status_idx" ON "Receivable"("status");

-- CreateIndex
CREATE INDEX "Receivable_dueDate_idx" ON "Receivable"("dueDate");

-- CreateIndex
CREATE INDEX "ReceivableDocument_receivableId_idx" ON "ReceivableDocument"("receivableId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_receivableId_key" ON "VerificationRequest"("receivableId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationRequest_organizationId_idx" ON "VerificationRequest"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RWTToken_receivableId_key" ON "RWTToken"("receivableId");

-- CreateIndex
CREATE INDEX "RWTToken_assetCode_idx" ON "RWTToken"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeListing_receivableId_key" ON "ExchangeListing"("receivableId");

-- CreateIndex
CREATE INDEX "ExchangeListing_status_idx" ON "ExchangeListing"("status");

-- CreateIndex
CREATE INDEX "Investment_investorOrgId_idx" ON "Investment"("investorOrgId");

-- CreateIndex
CREATE INDEX "Investment_listingId_idx" ON "Investment"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_receivableId_key" ON "Settlement"("receivableId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_receivableId_key" ON "RiskScore"("receivableId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradePassport" ADD CONSTRAINT "TradePassport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradePassportEvent" ADD CONSTRAINT "TradePassportEvent_tradePassportId_fkey" FOREIGN KEY ("tradePassportId") REFERENCES "TradePassport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivableDocument" ADD CONSTRAINT "ReceivableDocument_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationStep" ADD CONSTRAINT "VerificationStep_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RWTToken" ADD CONSTRAINT "RWTToken_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeListing" ADD CONSTRAINT "ExchangeListing_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ExchangeListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investorOrgId_fkey" FOREIGN KEY ("investorOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDistribution" ADD CONSTRAINT "SettlementDistribution_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementDistribution" ADD CONSTRAINT "SettlementDistribution_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
