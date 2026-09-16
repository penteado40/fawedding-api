-- CreateEnum
CREATE TYPE "GiftPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- AlterTable
ALTER TABLE "gifts" ADD COLUMN     "description" TEXT,
ADD COLUMN     "weddingId" INTEGER;

-- Backfill: every existing gift belongs to Felipe & Amanda (wedding id 1)
UPDATE "gifts" SET "weddingId" = 1 WHERE "weddingId" IS NULL;

-- AlterTable
ALTER TABLE "gifts" ALTER COLUMN "weddingId" SET NOT NULL;

-- CreateTable
CREATE TABLE "gift_payments" (
    "id" SERIAL NOT NULL,
    "giftId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "status" "GiftPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_payments" ADD CONSTRAINT "gift_payments_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
