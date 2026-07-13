/*
  Warnings:

  - You are about to drop the column `gstNumber` on the `suppliers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `suppliers` DROP COLUMN `gstNumber`,
    ADD COLUMN `bank_details` VARCHAR(191) NULL,
    ADD COLUMN `current_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `gstin` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `supplier_manufacturers` (
    `supplierId` INTEGER NOT NULL,
    `manufacturerId` INTEGER NOT NULL,

    PRIMARY KEY (`supplierId`, `manufacturerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `supplier_manufacturers` ADD CONSTRAINT `supplier_manufacturers_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_manufacturers` ADD CONSTRAINT `supplier_manufacturers_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `manufacturers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
