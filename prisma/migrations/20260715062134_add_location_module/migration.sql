/*
  Warnings:

  - You are about to drop the column `location` on the `batches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `batches` DROP COLUMN `location`,
    ADD COLUMN `location_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `type` ENUM('RACK', 'SHELF', 'BIN', 'COLD_STORAGE', 'WAREHOUSE', 'OTHER') NOT NULL DEFAULT 'RACK',
    `description` VARCHAR(300) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locations_code_key`(`code`),
    INDEX `locations_name_idx`(`name`),
    INDEX `locations_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `batches_location_id_idx` ON `batches`(`location_id`);

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
