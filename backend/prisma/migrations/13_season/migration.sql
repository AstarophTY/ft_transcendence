-- CreateEnum
CREATE TYPE "SeasonPhase" AS ENUM ('UPCOMING', 'BUILD', 'DELAY', 'VOTE', 'ENDED');

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_contestId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_voterId_fkey";

-- DropForeignKey
ALTER TABLE "VoteContest" DROP CONSTRAINT "VoteContest_campusId_fkey";

-- DropForeignKey
ALTER TABLE "VoteContestCandidate" DROP CONSTRAINT "VoteContestCandidate_contestId_fkey";

-- DropForeignKey
ALTER TABLE "VoteContestCandidate" DROP CONSTRAINT "VoteContestCandidate_userId_fkey";

-- DropTable
DROP TABLE "Vote";

-- DropTable
DROP TABLE "VoteContest";

-- DropTable
DROP TABLE "VoteContestCandidate";

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "buildStartsAt" TIMESTAMP(3) NOT NULL,
    "buildEndsAt" TIMESTAMP(3) NOT NULL,
    "voteStartsAt" TIMESTAMP(3) NOT NULL,
    "voteEndsAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonVote" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonResult" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "winnerUserId" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeasonResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeasonVote_seasonId_campusId_idx" ON "SeasonVote"("seasonId", "campusId");

-- CreateIndex
CREATE INDEX "SeasonVote_candidateId_idx" ON "SeasonVote"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonVote_seasonId_voterId_key" ON "SeasonVote"("seasonId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonResult_seasonId_campusId_key" ON "SeasonResult"("seasonId", "campusId");

-- AddForeignKey
ALTER TABLE "SeasonVote" ADD CONSTRAINT "SeasonVote_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonVote" ADD CONSTRAINT "SeasonVote_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonVote" ADD CONSTRAINT "SeasonVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonVote" ADD CONSTRAINT "SeasonVote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonResult" ADD CONSTRAINT "SeasonResult_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonResult" ADD CONSTRAINT "SeasonResult_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

