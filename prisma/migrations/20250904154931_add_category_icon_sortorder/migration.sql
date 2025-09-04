-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'Tag',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
