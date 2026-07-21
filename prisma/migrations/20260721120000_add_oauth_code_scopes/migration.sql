-- AlterTable
ALTER TABLE `OAuthCode` ADD COLUMN `scopes` JSON NOT NULL DEFAULT ('[]');
