-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Progress" (
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" REAL NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Progress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Progress" ("bookId", "id", "lastUpdated", "progress", "userId") SELECT "bookId", "id", "lastUpdated", "progress", "userId" FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
CREATE UNIQUE INDEX "Progress_userId_bookId_key" ON "Progress"("userId", "bookId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
