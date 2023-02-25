/*
  Warnings:

  - A unique constraint covering the columns `[userId,bookId]` on the table `Progress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_bookId_key" ON "Progress"("userId", "bookId");
