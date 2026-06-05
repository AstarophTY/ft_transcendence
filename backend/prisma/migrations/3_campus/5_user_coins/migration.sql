-- AlterTable: coins earned from 42 logtime, accrued since site registration.
ALTER TABLE "User" ADD COLUMN "coins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "logtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;
