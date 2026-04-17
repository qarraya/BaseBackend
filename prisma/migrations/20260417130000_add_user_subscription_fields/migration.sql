-- AlterTable
ALTER TABLE "User" ADD COLUMN     "freePlansCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3);
