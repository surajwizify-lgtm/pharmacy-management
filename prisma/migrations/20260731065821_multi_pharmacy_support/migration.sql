/*
  Warnings:

  - A unique constraint covering the columns `[pharmacyId,bill_number]` on the table `bills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,phone]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,code]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,grn_number]` on the table `purchase_invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,po_number]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,adjustment_number]` on the table `stock_adjustments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,return_number]` on the table `supplier_returns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pharmacyId,username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pharmacyId` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `gst_filing_periods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `gst_ledger_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `hospitals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `purchase_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `supplier_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyId` to the `suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `bills_bill_number_key` ON `bills`;

-- DropIndex
DROP INDEX `customers_phone_key` ON `customers`;

-- DropIndex
DROP INDEX `locations_code_key` ON `locations`;

-- DropIndex
DROP INDEX `purchase_invoices_grn_number_key` ON `purchase_invoices`;

-- DropIndex
DROP INDEX `purchase_orders_po_number_key` ON `purchase_orders`;

-- DropIndex
DROP INDEX `users_username_key` ON `users`;

-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `batches` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `bills` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `doctors` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `gst_filing_periods` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `gst_ledger_entries` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `hospitals` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `locations` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `purchase_invoices` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `stock_adjustments` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `supplier_returns` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `suppliers` ADD COLUMN `pharmacyId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `pharmacyId` INTEGER NULL,
    MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER', 'ACCOUNTANT') NOT NULL;

-- CreateTable
CREATE TABLE `Pharmacy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `gstin` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_pharmacyId_idx` ON `audit_logs`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `batches_pharmacyId_idx` ON `batches`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `bills_pharmacyId_idx` ON `bills`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `bills_pharmacyId_bill_number_key` ON `bills`(`pharmacyId`, `bill_number`);

-- CreateIndex
CREATE INDEX `customers_pharmacyId_idx` ON `customers`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `customers_pharmacyId_phone_key` ON `customers`(`pharmacyId`, `phone`);

-- CreateIndex
CREATE INDEX `doctors_pharmacyId_idx` ON `doctors`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `gst_filing_periods_pharmacyId_idx` ON `gst_filing_periods`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `gst_ledger_entries_pharmacyId_idx` ON `gst_ledger_entries`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `hospitals_pharmacyId_idx` ON `hospitals`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `locations_pharmacyId_idx` ON `locations`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `locations_pharmacyId_code_key` ON `locations`(`pharmacyId`, `code`);

-- CreateIndex
CREATE INDEX `products_pharmacyId_idx` ON `products`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `purchase_invoices_pharmacyId_idx` ON `purchase_invoices`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `purchase_invoices_pharmacyId_grn_number_key` ON `purchase_invoices`(`pharmacyId`, `grn_number`);

-- CreateIndex
CREATE INDEX `purchase_orders_pharmacyId_idx` ON `purchase_orders`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `purchase_orders_pharmacyId_po_number_key` ON `purchase_orders`(`pharmacyId`, `po_number`);

-- CreateIndex
CREATE INDEX `stock_adjustments_pharmacyId_idx` ON `stock_adjustments`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `stock_adjustments_pharmacyId_adjustment_number_key` ON `stock_adjustments`(`pharmacyId`, `adjustment_number`);

-- CreateIndex
CREATE INDEX `supplier_returns_pharmacyId_idx` ON `supplier_returns`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `supplier_returns_pharmacyId_return_number_key` ON `supplier_returns`(`pharmacyId`, `return_number`);

-- CreateIndex
CREATE INDEX `suppliers_pharmacyId_idx` ON `suppliers`(`pharmacyId`);

-- CreateIndex
CREATE INDEX `users_pharmacyId_idx` ON `users`(`pharmacyId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_pharmacyId_username_key` ON `users`(`pharmacyId`, `username`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_returns` ADD CONSTRAINT `supplier_returns_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospitals` ADD CONSTRAINT `hospitals_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_filing_periods` ADD CONSTRAINT `gst_filing_periods_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `Pharmacy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
