-- CreateTable
CREATE TABLE "UserCredentials" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,

    CONSTRAINT "UserCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCredentials_username_key" ON "UserCredentials"("username");
