/*
  Warnings:

  - The primary key for the `Directory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ShareLink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserCredentials` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Directory" DROP CONSTRAINT "Directory_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Directory" DROP CONSTRAINT "Directory_userId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_directoryId_fkey";

-- DropForeignKey
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_directoryId_fkey";

-- DropForeignKey
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_fileId_fkey";

-- DropForeignKey
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "UserCredentials" DROP CONSTRAINT "UserCredentials_userId_fkey";

-- AlterTable
ALTER TABLE "Directory" DROP CONSTRAINT "Directory_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "parentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Directory_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Directory_id_seq";

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "directoryId" SET DATA TYPE TEXT,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "File_id_seq";

-- AlterTable
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "directoryId" SET DATA TYPE TEXT,
ALTER COLUMN "fileId" SET DATA TYPE TEXT,
ALTER COLUMN "ownerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ShareLink_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "UserCredentials" DROP CONSTRAINT "UserCredentials_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserCredentials_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserCredentials_id_seq";

-- AddForeignKey
ALTER TABLE "UserCredentials" ADD CONSTRAINT "UserCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "Directory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Directory" ADD CONSTRAINT "Directory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Directory" ADD CONSTRAINT "Directory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Directory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "Directory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
