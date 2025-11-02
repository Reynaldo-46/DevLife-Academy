/*
  Warnings:

  - You are about to drop the column `thumbnail_url` on the `videos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "videos" DROP COLUMN "thumbnail_url",
ADD COLUMN     "original_path" TEXT,
ADD COLUMN     "processed_path" TEXT,
ADD COLUMN     "thumbnail_path" TEXT;
