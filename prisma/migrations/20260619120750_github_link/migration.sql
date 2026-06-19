-- CreateTable
CREATE TABLE `github_links` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `githubId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `tokenType` VARCHAR(191) NOT NULL DEFAULT 'bearer',
    `scope` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `profileUrl` VARCHAR(191) NULL,
    `linkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `github_links_userId_key`(`userId`),
    UNIQUE INDEX `github_links_githubId_key`(`githubId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `github_links` ADD CONSTRAINT `github_links_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUsers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
