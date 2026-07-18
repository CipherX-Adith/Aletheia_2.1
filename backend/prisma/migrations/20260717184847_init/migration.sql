-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ORG_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" DATETIME,
    "lastLoginAt" DATETIME,
    "organizationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "orgType" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ORG_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradePassport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "kybStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "trustScore" REAL NOT NULL DEFAULT 0,
    "reputationScore" REAL NOT NULL DEFAULT 0,
    "tradeVolume" REAL NOT NULL DEFAULT 0,
    "successfulTrades" INTEGER NOT NULL DEFAULT 0,
    "defaultCount" INTEGER NOT NULL DEFAULT 0,
    "avgSettlementDays" REAL,
    "certifications" TEXT,
    "activeSince" DATETIME,
    "expiresAt" DATETIME,
    "issuedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradePassport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradePassportEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradePassportId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradePassportEvent_tradePassportId_fkey" FOREIGN KEY ("tradePassportId") REFERENCES "TradePassport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "usdcBalance" REAL NOT NULL DEFAULT 0,
    "xlmBalance" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "txHash" TEXT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'USDC',
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableNumber" TEXT NOT NULL,
    "exporterId" TEXT NOT NULL,
    "buyerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" REAL NOT NULL,
    "discountRate" REAL,
    "fundingAmount" REAL,
    "commodity" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "incoterms" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerCountry" TEXT NOT NULL,
    "description" TEXT,
    "ipfsHash" TEXT,
    "submittedAt" DATETIME,
    "verifiedAt" DATETIME,
    "tokenizedAt" DATETIME,
    "fundedAt" DATETIME,
    "settledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Receivable_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receivable_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceivableDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ReceivableDocument_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "receivableId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "requestedInfoAt" DATETIME,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VerificationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationRequest_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verificationRequestId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationStep_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RWTToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "assetIssuer" TEXT NOT NULL,
    "totalSupply" REAL NOT NULL,
    "availableSupply" REAL NOT NULL,
    "tokenPrice" REAL NOT NULL,
    "stellarAssetId" TEXT,
    "mintTxHash" TEXT,
    "burnTxHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mintedAt" DATETIME,
    "burntAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RWTToken_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExchangeListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "targetAmount" REAL NOT NULL,
    "raisedAmount" REAL NOT NULL DEFAULT 0,
    "minInvestment" REAL NOT NULL DEFAULT 100,
    "maxInvestment" REAL,
    "yieldRate" REAL NOT NULL,
    "maturityDate" DATETIME NOT NULL,
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExchangeListing_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "investorOrgId" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "tokensBought" REAL NOT NULL,
    "tokenPrice" REAL NOT NULL,
    "expectedYield" REAL NOT NULL,
    "expectedReturn" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stellarTxHash" TEXT,
    "investedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ExchangeListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investment_investorOrgId_fkey" FOREIGN KEY ("investorOrgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "totalAmount" REAL NOT NULL,
    "platformFee" REAL NOT NULL,
    "netAmount" REAL NOT NULL,
    "stellarTxHash" TEXT,
    "initiatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "distributedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settlement_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettlementDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "principal" REAL NOT NULL,
    "yield" REAL NOT NULL,
    "stellarTxHash" TEXT,
    "distributedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SettlementDistribution_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SettlementDistribution_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT,
    "receivableId" TEXT,
    "score" REAL NOT NULL,
    "rating" TEXT NOT NULL,
    "factors" JSONB,
    "aiAnalysis" TEXT,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RiskScore_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskScore_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
