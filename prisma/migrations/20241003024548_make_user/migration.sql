/*
  Warnings:

  - You are about to drop the column `name` on the `UserCredentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserCredentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `UserCredentials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserCredentials" DROP COLUMN "name",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCredentials_userId_key" ON "UserCredentials"("userId");

-- AddForeignKey
ALTER TABLE "UserCredentials" ADD CONSTRAINT "UserCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
