-- CreateTable
CREATE TABLE "VoteContest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "campusId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteContest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteContestCandidate" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteContestCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoteContest_campusId_idx" ON "VoteContest"("campusId");

-- CreateIndex
CREATE INDEX "VoteContestCandidate_userId_idx" ON "VoteContestCandidate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteContestCandidate_contestId_userId_key" ON "VoteContestCandidate"("contestId", "userId");

-- CreateIndex
CREATE INDEX "Vote_candidateId_idx" ON "Vote"("candidateId");

-- CreateIndex
CREATE INDEX "Vote_contestId_idx" ON "Vote"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_contestId_voterId_key" ON "Vote"("contestId", "voterId");

-- AddForeignKey
ALTER TABLE "VoteContest" ADD CONSTRAINT "VoteContest_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteContestCandidate" ADD CONSTRAINT "VoteContestCandidate_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "VoteContest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteContestCandidate" ADD CONSTRAINT "VoteContestCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "VoteContest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "VoteContestCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
