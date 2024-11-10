/*
  Warnings:

  - Made the column `password` on table `UserCredentials` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `UserCredentials` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserCredentials" ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL;
