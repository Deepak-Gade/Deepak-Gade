-- Retain prior admin rejections when migrating the boolean verification history.
UPDATE "TutorProfile"
SET "verificationStatus" = 'REJECTED'
WHERE "isVerified" = false
  AND EXISTS (
    SELECT 1
    FROM "AdminAction"
    WHERE "AdminAction"."targetType" = 'TutorProfile'
      AND "AdminAction"."targetId" = "TutorProfile"."id"
      AND "AdminAction"."action" IN ('UNVERIFIED_TUTOR', 'REJECTED_TUTOR')
  );
