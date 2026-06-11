/*
  Warnings:

  - You are about to drop the `ComposeApps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Infra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `apiUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ComposeApps` DROP FOREIGN KEY `ComposeApps_infra_id_fkey`;

-- DropTable
DROP TABLE `ComposeApps`;

-- DropTable
DROP TABLE `Infra`;

-- DropTable
DROP TABLE `apiUsers`;
