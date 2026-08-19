-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('PENDING', 'SETTLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrustEdgeType" AS ENUM ('APPROVAL', 'RELATIONSHIP', 'AUTONOMY');

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "client_interactions" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "amount" DECIMAL(10,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "network" TEXT NOT NULL DEFAULT 'algorand-testnet',
    "status" "InteractionStatus" NOT NULL DEFAULT 'PENDING',
    "txnHash" TEXT,
    "contextRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "client_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_polls" (
    "id" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "hostEmail" TEXT NOT NULL,
    "hostId" TEXT,
    "title" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'DRAFT',
    "winningSlotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "scheduling_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_slots" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poll_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_invitees" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "reconsiderSentAt" TIMESTAMP(3),

    CONSTRAINT "poll_invitees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_responses" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL,

    CONSTRAINT "poll_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "hostEmail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT NOT NULL,
    "pollId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceUsd" DECIMAL(10,2) NOT NULL,
    "billingInterval" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_accounts" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "HostStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "host_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_edges" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "edgeType" "TrustEdgeType" NOT NULL,
    "actionType" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasoning" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "trust_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_interactions_status_idx" ON "client_interactions"("status");

-- CreateIndex
CREATE INDEX "scheduling_polls_status_idx" ON "scheduling_polls"("status");

-- CreateIndex
CREATE INDEX "scheduling_polls_hostId_idx" ON "scheduling_polls"("hostId");

-- CreateIndex
CREATE INDEX "poll_slots_pollId_idx" ON "poll_slots"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_invitees_token_key" ON "poll_invitees"("token");

-- CreateIndex
CREATE INDEX "poll_invitees_pollId_idx" ON "poll_invitees"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_responses_slotId_inviteeId_key" ON "poll_responses"("slotId", "inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_pollId_key" ON "calendar_events"("pollId");

-- CreateIndex
CREATE INDEX "calendar_events_hostEmail_idx" ON "calendar_events"("hostEmail");

-- CreateIndex
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "host_accounts_email_key" ON "host_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "host_accounts_slug_key" ON "host_accounts"("slug");

-- CreateIndex
CREATE INDEX "host_accounts_status_idx" ON "host_accounts"("status");

-- CreateIndex
CREATE INDEX "contacts_hostId_idx" ON "contacts"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_hostId_phone_key" ON "contacts"("hostId", "phone");

-- CreateIndex
CREATE INDEX "trust_edges_fromId_idx" ON "trust_edges"("fromId");

-- CreateIndex
CREATE UNIQUE INDEX "trust_edges_fromId_toId_actionType_key" ON "trust_edges"("fromId", "toId", "actionType");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_tokens_token_key" ON "magic_link_tokens"("token");

-- CreateIndex
CREATE INDEX "magic_link_tokens_hostId_idx" ON "magic_link_tokens"("hostId");

-- AddForeignKey
ALTER TABLE "scheduling_polls" ADD CONSTRAINT "scheduling_polls_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "host_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_slots" ADD CONSTRAINT "poll_slots_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "scheduling_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_invitees" ADD CONSTRAINT "poll_invitees_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "scheduling_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_responses" ADD CONSTRAINT "poll_responses_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "scheduling_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_responses" ADD CONSTRAINT "poll_responses_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "poll_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_responses" ADD CONSTRAINT "poll_responses_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "poll_invitees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "scheduling_polls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_accounts" ADD CONSTRAINT "host_accounts_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "host_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "host_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
