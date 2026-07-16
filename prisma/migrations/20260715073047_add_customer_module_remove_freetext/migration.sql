/*
  Warnings:

  - You are about to drop the column `customer_gstin` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `customer_name` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `customer_phone` on the `bills` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `bills` DROP COLUMN `customer_gstin`,
    DROP COLUMN `customer_name`,
    DROP COLUMN `customer_phone`,
    ADD COLUMN `customer_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `address` VARCHAR(300) NULL,
    `gstin` VARCHAR(15) NULL,
    `opening_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `current_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_phone_key`(`phone`),
    INDEX `customers_name_idx`(`name`),
    INDEX `customers_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `bills_customer_id_idx` ON `bills`(`customer_id`);

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
