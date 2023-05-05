/*
  Warnings:

  - You are about to drop the column `absences` on the `Prof` table. All the data in the column will be lost.

*/
/* -- AlterTable
ALTER TABLE "Prof" DROP COLUMN "absences";
 */
-- CreateTable
/* CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT,
    "public_key" TEXT,
    "auth_token" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_key" ON "Notification"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
 */