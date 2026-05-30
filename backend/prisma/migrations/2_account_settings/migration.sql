-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ONLINE', 'AWAY', 'DND', 'OFFLINE');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "displayName"       TEXT,
  ADD COLUMN "bio"               TEXT,
  ADD COLUMN "campus"            TEXT,
  ADD COLUMN "language"          TEXT,
  ADD COLUMN "theme"             TEXT,
  ADD COLUMN "status"            "UserStatus" NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN "statusMessage"     TEXT,
  ADD COLUMN "usernameChangedAt" TIMESTAMP(3);
