-- CreateTable
CREATE TABLE `platform_api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `prefix` VARCHAR(191) NOT NULL,
    `keyHash` VARCHAR(191) NOT NULL,
    `scopes` JSON NOT NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `lastUsedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `platform_api_keys_keyHash_key`(`keyHash`),
    INDEX `platform_api_keys_userId_idx`(`userId`),
    INDEX `platform_api_keys_revokedAt_idx`(`revokedAt`),
    INDEX `platform_api_keys_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `platform_api_keys` ADD CONSTRAINT `platform_api_keys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUsers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
