-- AlterTable
ALTER TABLE `DeviceToken` ADD COLUMN `deviceBrand` VARCHAR(191) NULL,
    ADD COLUMN `deviceModelName` VARCHAR(191) NULL,
    ADD COLUMN `deviceName` VARCHAR(191) NULL,
    ADD COLUMN `deviceVersion` VARCHAR(191) NULL;
