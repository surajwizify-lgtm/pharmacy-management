/*
  Warnings:

  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `batchId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `batchNumber` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseOrderId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `sellingPrice` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `batchId` on the `supplier_return_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `supplier_return_items` table. All the data in the column will be lost.
  - You are about to drop the column `supplierReturnId` on the `supplier_return_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `supplier_return_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `supplier_return_items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `supplier_returns` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseOrderId` on the `supplier_returns` table. All the data in the column will be lost.
  - You are about to drop the column `returnNumber` on the `supplier_returns` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `supplier_returns` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `supplier_returns` table. All the data in the column will be lost.
  - You are about to drop the `purchaseorder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplierpayment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[return_number]` on the table `supplier_returns` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expected_rate` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_order_id` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batch_id` to the `supplier_return_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `supplier_return_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_return_id` to the `supplier_return_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `supplier_return_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `supplier_return_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `return_number` to the `supplier_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_id` to the `supplier_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `supplier_returns` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `purchase_order_items` DROP FOREIGN KEY `purchase_order_items_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_items` DROP FOREIGN KEY `purchase_order_items_productId_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_items` DROP FOREIGN KEY `purchase_order_items_purchaseOrderId_fkey`;

-- DropForeignKey
ALTER TABLE `purchaseorder` DROP FOREIGN KEY `PurchaseOrder_supplierId_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_return_items` DROP FOREIGN KEY `supplier_return_items_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_return_items` DROP FOREIGN KEY `supplier_return_items_productId_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_return_items` DROP FOREIGN KEY `supplier_return_items_supplierReturnId_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_returns` DROP FOREIGN KEY `supplier_returns_purchaseOrderId_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_returns` DROP FOREIGN KEY `supplier_returns_supplierId_fkey`;

-- DropForeignKey
ALTER TABLE `supplierpayment` DROP FOREIGN KEY `SupplierPayment_purchaseOrderId_fkey`;

-- DropForeignKey
ALTER TABLE `supplierpayment` DROP FOREIGN KEY `SupplierPayment_supplierId_fkey`;

-- DropIndex
DROP INDEX `purchase_order_items_batchId_key` ON `purchase_order_items`;

-- DropIndex
DROP INDEX `supplier_returns_returnNumber_key` ON `supplier_returns`;

-- AlterTable
ALTER TABLE `batches` ADD COLUMN `manufacture_date` DATE NULL,
    ADD COLUMN `mrp` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `category`,
    ADD COLUMN `category_id` INTEGER NULL,
    ADD COLUMN `generic_name` VARCHAR(200) NULL,
    ADD COLUMN `manufacturer_id` INTEGER NULL,
    ADD COLUMN `pack_size` VARCHAR(50) NULL,
    ADD COLUMN `reorder_level` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `schedule_type` ENUM('OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X') NOT NULL DEFAULT 'OTC',
    ADD COLUMN `unit` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `purchase_order_items` DROP COLUMN `batchId`,
    DROP COLUMN `batchNumber`,
    DROP COLUMN `expiryDate`,
    DROP COLUMN `location`,
    DROP COLUMN `productId`,
    DROP COLUMN `purchaseOrderId`,
    DROP COLUMN `sellingPrice`,
    DROP COLUMN `totalPrice`,
    DROP COLUMN `unitPrice`,
    ADD COLUMN `expected_rate` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `product_id` INTEGER NOT NULL,
    ADD COLUMN `purchase_order_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `supplier_return_items` DROP COLUMN `batchId`,
    DROP COLUMN `productId`,
    DROP COLUMN `supplierReturnId`,
    DROP COLUMN `totalPrice`,
    DROP COLUMN `unitPrice`,
    ADD COLUMN `batch_id` INTEGER NOT NULL,
    ADD COLUMN `gst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `product_id` INTEGER NOT NULL,
    ADD COLUMN `supplier_return_id` INTEGER NOT NULL,
    ADD COLUMN `total_price` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `unit_price` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `supplier_returns` DROP COLUMN `createdAt`,
    DROP COLUMN `purchaseOrderId`,
    DROP COLUMN `returnNumber`,
    DROP COLUMN `supplierId`,
    DROP COLUMN `totalAmount`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `purchase_invoice_id` INTEGER NULL,
    ADD COLUMN `refund_type` VARCHAR(191) NOT NULL DEFAULT 'credit_note',
    ADD COLUMN `return_number` VARCHAR(191) NOT NULL,
    ADD COLUMN `supplier_id` INTEGER NOT NULL,
    ADD COLUMN `total_amount` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `total_gst` DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'PHARMACIST', 'CASHIER', 'ACCOUNTANT') NOT NULL;

-- DropTable
DROP TABLE `purchaseorder`;

-- DropTable
DROP TABLE `supplier`;

-- DropTable
DROP TABLE `supplierpayment`;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `parent_id` INTEGER NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manufacturers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `contact_person` VARCHAR(200) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `address` VARCHAR(300) NULL,
    `gstin` VARCHAR(15) NULL,
    `drug_license_no` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `manufacturers_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `drug_license_no` VARCHAR(191) NULL,
    `payment_terms` VARCHAR(191) NULL,
    `opening_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suppliers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_number` VARCHAR(191) NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `order_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expected_date` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_orders_po_number_key`(`po_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_number` VARCHAR(100) NOT NULL,
    `grn_number` VARCHAR(191) NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `purchase_order_id` INTEGER NULL,
    `invoice_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_inter_state` BOOLEAN NOT NULL DEFAULT false,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `total_discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_cgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_igst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_gst` DECIMAL(12, 2) NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `payment_status` ENUM('DUE', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'DUE',
    `attachment_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_invoices_grn_number_key`(`grn_number`),
    INDEX `purchase_invoices_supplier_id_idx`(`supplier_id`),
    INDEX `purchase_invoices_purchase_order_id_idx`(`purchase_order_id`),
    INDEX `purchase_invoices_invoice_date_idx`(`invoice_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_invoice_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_invoice_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `batch_number` VARCHAR(191) NOT NULL,
    `manufacture_date` DATE NULL,
    `expiry_date` DATE NOT NULL,
    `quantity` INTEGER NOT NULL,
    `free_quantity` INTEGER NOT NULL DEFAULT 0,
    `purchase_rate` DECIMAL(10, 2) NOT NULL,
    `mrp` DECIMAL(10, 2) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `hsn_code` VARCHAR(20) NOT NULL,
    `gst_percentage` DECIMAL(5, 2) NOT NULL,
    `cgst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `sgst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `igst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `taxable_value` DECIMAL(12, 2) NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `location` VARCHAR(191) NULL,
    `batch_id` INTEGER NULL,

    UNIQUE INDEX `purchase_invoice_items_batch_id_key`(`batch_id`),
    INDEX `purchase_invoice_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier_id` INTEGER NOT NULL,
    `purchase_invoice_id` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_mode` VARCHAR(191) NOT NULL,
    `reference_no` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supplier_payments_supplier_id_idx`(`supplier_id`),
    INDEX `supplier_payments_purchase_invoice_id_idx`(`purchase_invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_adjustments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustment_number` VARCHAR(191) NOT NULL,
    `product_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `quantity_adjusted` INTEGER NOT NULL,
    `reason` ENUM('DAMAGED', 'EXPIRED_WRITE_OFF', 'THEFT', 'STOCK_COUNT_CORRECTION', 'OTHER') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `approved_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stock_adjustments_adjustment_number_key`(`adjustment_number`),
    INDEX `stock_adjustments_product_id_idx`(`product_id`),
    INDEX `stock_adjustments_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gst_ledger_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('INPUT', 'OUTPUT') NOT NULL,
    `purchase_invoice_id` INTEGER NULL,
    `supplier_return_id` INTEGER NULL,
    `bill_id` INTEGER NULL,
    `taxable_value` DECIMAL(12, 2) NOT NULL,
    `cgst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `igst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_gst` DECIMAL(12, 2) NOT NULL,
    `entry_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gst_ledger_entries_purchase_invoice_id_key`(`purchase_invoice_id`),
    UNIQUE INDEX `gst_ledger_entries_supplier_return_id_key`(`supplier_return_id`),
    UNIQUE INDEX `gst_ledger_entries_bill_id_key`(`bill_id`),
    INDEX `gst_ledger_entries_type_idx`(`type`),
    INDEX `gst_ledger_entries_entry_date_idx`(`entry_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gst_filing_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `total_output_gst` DECIMAL(12, 2) NOT NULL,
    `total_input_gst` DECIMAL(12, 2) NOT NULL,
    `net_payable` DECIMAL(12, 2) NOT NULL,
    `amount_paid` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `filed` BOOLEAN NOT NULL DEFAULT false,
    `filed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `purchase_order_items_product_id_idx` ON `purchase_order_items`(`product_id`);

-- CreateIndex
CREATE INDEX `supplier_return_items_batch_id_idx` ON `supplier_return_items`(`batch_id`);

-- CreateIndex
CREATE UNIQUE INDEX `supplier_returns_return_number_key` ON `supplier_returns`(`return_number`);

-- CreateIndex
CREATE INDEX `supplier_returns_supplier_id_idx` ON `supplier_returns`(`supplier_id`);

-- CreateIndex
CREATE INDEX `supplier_returns_purchase_invoice_id_idx` ON `supplier_returns`(`purchase_invoice_id`);

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_manufacturer_id_fkey` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoices` ADD CONSTRAINT `purchase_invoices_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_purchase_invoice_id_fkey` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_returns` ADD CONSTRAINT `supplier_returns_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_returns` ADD CONSTRAINT `supplier_returns_purchase_invoice_id_fkey` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_return_items` ADD CONSTRAINT `supplier_return_items_supplier_return_id_fkey` FOREIGN KEY (`supplier_return_id`) REFERENCES `supplier_returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_return_items` ADD CONSTRAINT `supplier_return_items_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_return_items` ADD CONSTRAINT `supplier_return_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_purchase_invoice_id_fkey` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_purchase_invoice_id_fkey` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_supplier_return_id_fkey` FOREIGN KEY (`supplier_return_id`) REFERENCES `supplier_returns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
