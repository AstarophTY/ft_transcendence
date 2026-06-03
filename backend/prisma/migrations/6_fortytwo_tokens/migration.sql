-- AlterTable: store the user's 42 OAuth tokens to refresh their logtime later.
ALTER TABLE "User" ADD COLUMN "fortyTwoAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "fortyTwoRefreshToken" TEXT;
