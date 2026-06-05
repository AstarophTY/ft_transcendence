CREATE SEQUENCE IF NOT EXISTS "BlockLog_id_seq";

ALTER TABLE "BlockLog"
ALTER COLUMN "id"
SET DEFAULT nextval('"BlockLog_id_seq"');

ALTER TABLE "BlockLog" ADD COLUMN "placedBlock" INTEGER NOT NULL DEFAULT 0;

SELECT setval('"BlockLog_id_seq"', COALESCE((SELECT MAX(id) FROM "BlockLog"), 1));