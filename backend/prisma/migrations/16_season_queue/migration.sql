-- Support queued (scheduled) seasons: track when a season was activated.
ALTER TABLE "Season" ADD COLUMN "startedAt" TIMESTAMP(3);

-- Existing seasons already had their world rollover run at creation time under
-- the old logic, so treat them as already started to avoid re-triggering a wipe.
UPDATE "Season" SET "startedAt" = "createdAt" WHERE "startedAt" IS NULL;
