/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Note` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."Note" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Personal';
