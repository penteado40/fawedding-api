-- AlterTable
-- Adds a nullable tokenHash column alongside the existing plaintext token column.
-- Existing rows must be backfilled with `npm run backfill:token-hash` before the
-- auth middleware's hash-based lookup will work for tokens issued before this migration.
-- The plaintext `token` column is intentionally kept for now (rollback safety) and
-- dropped in a follow-up migration once the switch is confirmed working.
ALTER TABLE "api_tokens" ADD COLUMN "tokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_tokenHash_key" ON "api_tokens"("tokenHash");
