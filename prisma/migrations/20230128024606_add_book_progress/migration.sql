/*
  Warnings:

  - You are about to drop the `BookProgress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BookProgress";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Progress" (
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" REAL NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Progress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
