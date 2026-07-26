-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "contentTypes" TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "externalLinks" TEXT[],
ADD COLUMN     "textContent" TEXT,
ADD COLUMN     "videoFileName" TEXT,
ADD COLUMN     "videoType" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;
