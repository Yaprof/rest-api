/*
  Warnings:

  - A unique constraint covering the columns `[establishment]` on the table `Cantine` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Cantine_establishment_key" ON "Cantine"("establishment");
