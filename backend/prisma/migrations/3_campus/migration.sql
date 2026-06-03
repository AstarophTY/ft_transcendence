-- CreateEnum
CREATE TYPE "CampusRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Campus" (
    "id"    TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_label_key" ON "Campus"("label");

-- AlterTable: introduce the campus relation alongside the old free-text column.
ALTER TABLE "User" ADD COLUMN "campusId" TEXT;

-- Backfill: turn every distinct campus label into a Campus row, then link users.
INSERT INTO "Campus" ("id", "label")
SELECT gen_random_uuid(), label
FROM (SELECT DISTINCT "campus" AS label FROM "User" WHERE "campus" IS NOT NULL) AS labels;

UPDATE "User" AS u
SET "campusId" = c."id"
FROM "Campus" AS c
WHERE u."campus" = c."label";

-- Drop the old free-text column now that data has moved to the relation.
ALTER TABLE "User" DROP COLUMN "campus";

-- AddForeignKey
ALTER TABLE "User"
  ADD CONSTRAINT "User_campusId_fkey"
  FOREIGN KEY ("campusId") REFERENCES "Campus"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CampusRequest" (
    "id"            TEXT NOT NULL,
    "label"         TEXT NOT NULL,
    "status"        "CampusRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CampusRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampusRequest_status_idx" ON "CampusRequest"("status");

-- CreateIndex
CREATE INDEX "CampusRequest_requestedById_idx" ON "CampusRequest"("requestedById");

-- AddForeignKey
ALTER TABLE "CampusRequest"
  ADD CONSTRAINT "CampusRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
