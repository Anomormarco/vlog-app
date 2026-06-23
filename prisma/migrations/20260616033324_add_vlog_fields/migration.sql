
ALTER TABLE `posts` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    ADD COLUMN `mediaUrl` VARCHAR(191) NULL,
    ADD COLUMN `published` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `tags` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `thumbnailUrl` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT '';


CREATE INDEX `posts_category_idx` ON `posts`(`category`);
