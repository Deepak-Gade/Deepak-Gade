-- Preserve existing tutor records and derive their initial review state.
ALTER TABLE "TutorProfile" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';

UPDATE "TutorProfile"
SET "verificationStatus" = CASE WHEN "isVerified" = true THEN 'VERIFIED' ELSE 'PENDING' END;
