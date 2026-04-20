/*
  Warnings:

  - A unique constraint covering the columns `[serialNumber]` on the table `licenses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serialNumber` to the `licenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `licenses` ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `serialNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `licenses_serialNumber_key` ON `licenses`(`serialNumber`);
