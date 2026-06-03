-- AlterTable: logtime accrued during the current calendar month (display only).
ALTER TABLE "User" ADD COLUMN "monthLogtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;
