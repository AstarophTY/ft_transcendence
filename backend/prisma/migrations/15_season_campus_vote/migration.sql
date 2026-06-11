-- CreateTable
CREATE TABLE "SeasonCampusVote" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonCampusVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeasonCampusVote_seasonId_campusId_idx" ON "SeasonCampusVote"("seasonId", "campusId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonCampusVote_seasonId_voterId_key" ON "SeasonCampusVote"("seasonId", "voterId");

-- AddForeignKey
ALTER TABLE "SeasonCampusVote" ADD CONSTRAINT "SeasonCampusVote_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonCampusVote" ADD CONSTRAINT "SeasonCampusVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonCampusVote" ADD CONSTRAINT "SeasonCampusVote_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
