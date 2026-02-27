/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profilePictureUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `User` table. All the data in the column will be lost.
  - Added the required column `activityLevel` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentWeight` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goal` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('LOSE', 'MAINTAIN', 'GAIN');

-- CreateEnum
CREATE TYPE "ChronicDiseasesType" AS ENUM ('DISEASE', 'ALLERGY');

-- CreateEnum
CREATE TYPE "MealTime" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "ActivityLevelEnum" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'MESSAGE', 'REMINDER', 'WARNING', 'SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "name",
DROP COLUMN "profilePictureUrl",
DROP COLUMN "updatedAt",
DROP COLUMN "verificationCode",
ADD COLUMN     "activityLevel" "ActivityLevelEnum" NOT NULL,
ADD COLUMN     "currentWeight" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "goal" "Goal" NOT NULL,
ADD COLUMN     "height" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "isVerified" SET DEFAULT true,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChronicDiseases" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChronicDiseasesType" NOT NULL,

    CONSTRAINT "ChronicDiseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChronicDiseases" (
    "userId" TEXT NOT NULL,
    "conditionId" INTEGER NOT NULL,

    CONSTRAINT "UserChronicDiseases_pkey" PRIMARY KEY ("userId","conditionId")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "time" "MealTime" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealChronicDiseases" (
    "mealId" TEXT NOT NULL,
    "chronicDiseasesId" INTEGER NOT NULL,

    CONSTRAINT "MealChronicDiseases_pkey" PRIMARY KEY ("mealId","chronicDiseasesId")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "totalCalories" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanMeal" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "mealTime" "MealTime" NOT NULL,
    "planId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,

    CONSTRAINT "PlanMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "newWeight" DOUBLE PRECISION NOT NULL,
    "previousWeight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "UserChronicDiseases" ADD CONSTRAINT "UserChronicDiseases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChronicDiseases" ADD CONSTRAINT "UserChronicDiseases_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "ChronicDiseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealChronicDiseases" ADD CONSTRAINT "MealChronicDiseases_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealChronicDiseases" ADD CONSTRAINT "MealChronicDiseases_chronicDiseasesId_fkey" FOREIGN KEY ("chronicDiseasesId") REFERENCES "ChronicDiseases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMeal" ADD CONSTRAINT "PlanMeal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMeal" ADD CONSTRAINT "PlanMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
