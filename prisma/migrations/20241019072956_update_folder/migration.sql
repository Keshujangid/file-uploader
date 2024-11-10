-- DropIndex
DROP INDEX "Folder_name_key";

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "name" DROP DEFAULT;
