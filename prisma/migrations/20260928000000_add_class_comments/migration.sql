-- CreateTable
CREATE TABLE "ClassComment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClassCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassCommentLike_commentId_userId_key" ON "ClassCommentLike"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "ClassComment" ADD CONSTRAINT "ClassComment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassComment" ADD CONSTRAINT "ClassComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCommentLike" ADD CONSTRAINT "ClassCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ClassComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCommentLike" ADD CONSTRAINT "ClassCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
