-- AlterTable: drop UUID id and replace with SERIAL autoincrement
ALTER TABLE "gifts" DROP CONSTRAINT "gifts_pkey",
DROP COLUMN "id",
ADD COLUMN "id" SERIAL NOT NULL,
ADD CONSTRAINT "gifts_pkey" PRIMARY KEY ("id");
