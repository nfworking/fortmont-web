-- CreateTable
CREATE TABLE `apiUsers` (
    `id` VARCHAR(191) NOT NULL,
    `fName` VARCHAR(191) NOT NULL,
    `lName` VARCHAR(191) NOT NULL,
    `publicPhoto` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `personalEmail` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
