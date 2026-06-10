-- AlterTable
ALTER TABLE "VoteContest" ADD COLUMN     "winnerId" TEXT;

-- AddForeignKey
ALTER TABLE "VoteContest" ADD CONSTRAINT "VoteContest_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
