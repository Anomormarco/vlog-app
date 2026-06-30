CREATE TABLE "social_notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "postId" INTEGER,
    "commentId" INTEGER,
    "actorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_notifications_userId_read_idx" ON "social_notifications"("userId", "read");
CREATE INDEX "social_notifications_createdAt_idx" ON "social_notifications"("createdAt");

ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
