-- CreateTable
CREATE TABLE "Book" (
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "desc" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_path_key" ON "Book"("path");
