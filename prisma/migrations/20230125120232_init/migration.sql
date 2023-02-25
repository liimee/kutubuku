-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "desc" TEXT,
    "id" TEXT
);
INSERT INTO "new_Book" ("author", "desc", "path", "title") SELECT "author", "desc", "path", "title" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_path_key" ON "Book"("path");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
