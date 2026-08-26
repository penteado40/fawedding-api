-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'USER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "weddings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");

-- CreateTable
CREATE TABLE "wedding_managers" (
    "id" SERIAL NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_managers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wedding_managers_weddingId_userId_key" ON "wedding_managers"("weddingId", "userId");

-- AddForeignKey
ALTER TABLE "wedding_managers" ADD CONSTRAINT "wedding_managers_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_managers" ADD CONSTRAINT "wedding_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: initial wedding for the existing real data (Felipe & Amanda, 2026-05-28)
INSERT INTO "weddings" ("id", "name", "slug", "date", "createdAt", "updatedAt")
VALUES (1, 'Felipe e Amanda', 'felipe-e-amanda', '2026-05-28T00:00:00.000Z', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Keep the id sequence in sync after the explicit id=1 insert above
SELECT setval(pg_get_serial_sequence('"weddings"', 'id'), (SELECT MAX("id") FROM "weddings"));

-- AlterTable: add weddingId to rsvps (nullable first, backfilled below)
ALTER TABLE "rsvps" ADD COLUMN "weddingId" INTEGER;

UPDATE "rsvps" SET "weddingId" = 1;

ALTER TABLE "rsvps" ALTER COLUMN "weddingId" SET NOT NULL;

-- DropIndex: global unique on email is replaced by a per-wedding unique below
DROP INDEX "rsvps_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_weddingId_email_key" ON "rsvps"("weddingId", "email");

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: add weddingId to api_tokens (nullable first, backfilled below)
ALTER TABLE "api_tokens" ADD COLUMN "weddingId" INTEGER;

UPDATE "api_tokens" SET "weddingId" = 1;

ALTER TABLE "api_tokens" ALTER COLUMN "weddingId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: link the two existing users as managers of the initial wedding
INSERT INTO "wedding_managers" ("weddingId", "userId", "createdAt")
SELECT 1, "id", CURRENT_TIMESTAMP FROM "users" WHERE "id" IN (1, 2);

-- Backfill: promote user 1 to SUPER_ADMIN; user 2 stays USER (default)
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "id" = 1;
