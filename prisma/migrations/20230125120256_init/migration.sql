/*
  Warnings:

  - Made the column `id` on table `Book` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "desc" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_Book" ("author", "desc", "id", "path", "title") SELECT "author", "desc", "id", "path", "title" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_path_key" ON "Book"("path");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
