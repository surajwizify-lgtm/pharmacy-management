/*
  Warnings:

  - You are about to drop the column `product_id` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `bill_items` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `purchase_invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `supplier_return_items` table. All the data in the column will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `product_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `bill_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `purchase_invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `supplier_return_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `batches` DROP FOREIGN KEY `batches_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `bill_items` DROP FOREIGN KEY `bill_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_manufacturer_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_invoice_items` DROP FOREIGN KEY `purchase_invoice_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_items` DROP FOREIGN KEY `purchase_order_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `stock_adjustments` DROP FOREIGN KEY `stock_adjustments_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `supplier_return_items` DROP FOREIGN KEY `supplier_return_items_product_id_fkey`;

-- DropIndex
DROP INDEX `batches_product_id_expiry_date_idx` ON `batches`;

-- AlterTable
ALTER TABLE `batches` DROP COLUMN `product_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `bill_items` DROP COLUMN `product_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `purchase_invoice_items` DROP COLUMN `product_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `purchase_order_items` DROP COLUMN `product_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `stock_adjustments` DROP COLUMN `product_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `supplier_return_items` DROP COLUMN `product_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `products`;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `generic_name` VARCHAR(200) NULL,
    `manufacturer` VARCHAR(200) NULL,
    `manufacturer_id` INTEGER NULL,
    `category_id` INTEGER NULL,
    `barcode` VARCHAR(50) NULL,
    `hsn_code` VARCHAR(20) NULL,
    `gst_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `gst_type` ENUM('INCLUSIVE', 'EXCLUSIVE') NOT NULL DEFAULT 'INCLUSIVE',
    `unit` VARCHAR(50) NOT NULL DEFAULT 'strip',
    `pack_size` VARCHAR(50) NULL,
    `default_mrp` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `reorder_level` INTEGER NOT NULL DEFAULT 10,
    `rack_location` VARCHAR(50) NULL,
    `schedule_type` ENUM('OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X') NOT NULL DEFAULT 'OTC',
    `prescription_required` BOOLEAN NOT NULL DEFAULT false,
    `tracks_expiry` BOOLEAN NOT NULL DEFAULT true,
    `attributes` JSON NULL,
    `status` ENUM('ACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `products_name_idx`(`name`),
    INDEX `products_hsn_code_idx`(`hsn_code`),
    INDEX `products_status_idx`(`status`),
    INDEX `products_barcode_idx`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `batches_product_id_idx` ON `batches`(`product_id`);

-- CreateIndex
CREATE INDEX `batches_product_id_expiry_date_idx` ON `batches`(`product_id`, `expiry_date`);

-- CreateIndex
CREATE INDEX `purchase_invoice_items_product_id_idx` ON `purchase_invoice_items`(`product_id`);

-- CreateIndex
CREATE INDEX `purchase_order_items_product_id_idx` ON `purchase_order_items`(`product_id`);

-- CreateIndex
CREATE INDEX `stock_adjustments_product_id_idx` ON `stock_adjustments`(`product_id`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_manufacturer_id_fkey` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_invoice_items` ADD CONSTRAINT `purchase_invoice_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_return_items` ADD CONSTRAINT `supplier_return_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_items` ADD CONSTRAINT `bill_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
