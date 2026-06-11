-- Repairs schema drift on databases initialised before these columns were
-- folded back into 0_init. They were added to schema.prisma without a dedicated
-- ALTER migration, so any DB whose 0_init was already applied lacks them, which
-- breaks the 42 login flow (P2022). Idempotent so it is a no-op on fresh DBs.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthLogtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fortyTwoAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fortyTwoRefreshToken" TEXT;
