ALTER TABLE `video_messages`
    ADD COLUMN `recipientId` VARCHAR(191) NULL AFTER `ownerId`,
    MODIFY `description` TEXT NULL;

CREATE INDEX `video_messages_recipientId_idx` ON `video_messages`(`recipientId`);

ALTER TABLE `video_messages`
    ADD CONSTRAINT `video_messages_recipientId_fkey`
    FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
