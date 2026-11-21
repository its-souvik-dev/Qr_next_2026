-- CreateEnum
CREATE TYPE "QRType" AS ENUM ('URL', 'TEXT', 'EMAIL', 'PHONE', 'SMS', 'WIFI', 'WHATSAPP', 'LOCATION', 'VCARD', 'SOCIAL', 'APP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "QRType" NOT NULL,
    "payload" JSONB NOT NULL,
    "content" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "shortLinkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainId" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "device" TEXT NOT NULL DEFAULT 'desktop',
    "browser" TEXT,
    "os" TEXT,
    "referrer" TEXT,
    "visitorHash" TEXT NOT NULL,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDomain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analyticsRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "collectCountry" BOOLEAN NOT NULL DEFAULT true,
    "collectReferrer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "QRCode_userId_createdAt_idx" ON "QRCode"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "QRCode_shortLinkId_idx" ON "QRCode"("shortLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "ShortLink"("slug");

-- CreateIndex
CREATE INDEX "ShortLink_userId_createdAt_idx" ON "ShortLink"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ShortLink_userId_category_idx" ON "ShortLink"("userId", "category");

-- CreateIndex
CREATE INDEX "ShortLink_domainId_idx" ON "ShortLink"("domainId");

-- CreateIndex
CREATE INDEX "LinkClick_linkId_createdAt_idx" ON "LinkClick"("linkId", "createdAt");

-- CreateIndex
CREATE INDEX "LinkClick_createdAt_idx" ON "LinkClick"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QRTemplate_userId_name_key" ON "QRTemplate"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_hostname_key" ON "CustomDomain"("hostname");

-- CreateIndex
CREATE INDEX "CustomDomain_userId_idx" ON "CustomDomain"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "CustomDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRTemplate" ADD CONSTRAINT "QRTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
