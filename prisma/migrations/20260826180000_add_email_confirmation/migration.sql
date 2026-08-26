-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable: weddings.siteUrl (backfill existing rows before enforcing NOT NULL)
ALTER TABLE "weddings" ADD COLUMN "siteUrl" TEXT;

UPDATE "weddings" SET "siteUrl" = 'https://fawedding.com.br' WHERE "siteUrl" IS NULL;

ALTER TABLE "weddings" ALTER COLUMN "siteUrl" SET NOT NULL;

-- AlterTable: rsvps email tracking columns
ALTER TABLE "rsvps" ADD COLUMN "emailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "rsvps" ADD COLUMN "emailSentAt" TIMESTAMP(3);
ALTER TABLE "rsvps" ADD COLUMN "emailError" TEXT;
