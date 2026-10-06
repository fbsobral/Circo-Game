INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "url", "read", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || c."id"),
  p."authorId",
  'comment',
  COALESCE(ca."name", 'Alguém') || ' comentou no seu post',
  CASE WHEN length(c."content") > 200 THEN left(c."content", 200) || '…' ELSE c."content" END,
  '/feed#post-' || p."id",
  false,
  c."createdAt"
FROM "PostComment" c
JOIN "Post" p ON p."id" = c."postId"
JOIN "User" pa ON pa."id" = p."authorId"
JOIN "User" ca ON ca."id" = c."authorId"
WHERE c."authorId" <> p."authorId"
  AND c."content" NOT ILIKE '%@todos%'
  AND (pa."name" IS NULL OR position(lower('@' || pa."name") in lower(c."content")) = 0);
