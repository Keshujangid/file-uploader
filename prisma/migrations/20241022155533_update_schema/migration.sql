-- CreateEnum
CREATE TYPE "DocTypes" AS ENUM ('FILE', 'DIRECTORY');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "directoryId" INTEGER;

-- CreateTable
CREATE TABLE "Directory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocTypes" NOT NULL DEFAULT 'DIRECTORY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "Directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" SERIAL NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "itemType" "DocTypes" NOT NULL,
    "directoryId" INTEGER,
    "fileId" INTEGER,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

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
