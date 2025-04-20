-- CreateTable -- (Este comentario es opcional, puedes borrarlo)
-- CREATE TABLE `users` (
--    `id` INTEGER NOT NULL AUTO_INCREMENT,
--    `username` VARCHAR(50) NULL,
--    `email` VARCHAR(100) NOT NULL,
--    `password_hash` VARCHAR(255) NOT NULL,
--    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
--    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
--
--    UNIQUE INDEX `username`(`username`),
--    UNIQUE INDEX `email`(`email`),
--    PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; -- (Todo esto borrado o comentado)

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(10) NOT NULL,
    `content` TEXT NOT NULL,
    `timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `userId` INTEGER NOT NULL,

    INDEX `chat_messages_userId_timestamp_idx`(`userId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;