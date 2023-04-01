-- CreateTable
CREATE TABLE "_dislikedBy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_dislikedBy_AB_unique" ON "_dislikedBy"("A", "B");

-- CreateIndex
CREATE INDEX "_dislikedBy_B_index" ON "_dislikedBy"("B");

-- AddForeignKey
ALTER TABLE "_dislikedBy" ADD CONSTRAINT "_dislikedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dislikedBy" ADD CONSTRAINT "_dislikedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
