UPDATE "Notification"
SET "url" = '/post/' || substring("url" from '/feed#post-(.+)$')
WHERE "url" ~ '/feed#post-.+$';
