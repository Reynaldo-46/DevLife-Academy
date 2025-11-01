-- Add transcoding fields to Video table
ALTER TABLE "videos" ADD COLUMN "transcoding_status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "videos" ADD COLUMN "transcoding_progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "videos" ADD COLUMN "transcoding_error" TEXT;

-- Create TranscodingStatus enum
CREATE TYPE "TranscodingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Update transcoding_status column to use enum
ALTER TABLE "videos" ALTER COLUMN "transcoding_status" TYPE "TranscodingStatus" USING "transcoding_status"::"TranscodingStatus";

-- Create quality_variants table
CREATE TABLE "quality_variants" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "bitrate" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_variants_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "quality_variants_video_id_quality_key" ON "quality_variants"("video_id", "quality");
CREATE INDEX "quality_variants_video_id_idx" ON "quality_variants"("video_id");
CREATE INDEX "videos_transcoding_status_idx" ON "videos"("transcoding_status");

-- Add foreign key
ALTER TABLE "quality_variants" ADD CONSTRAINT "quality_variants_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
