-- AlterTable
ALTER TABLE `bills` ADD COLUMN `doctor_id` INTEGER NULL,
    ADD COLUMN `hospital_id` INTEGER NULL,
    ADD COLUMN `prescription_file` VARCHAR(500) NULL,
    ADD COLUMN `prescription_name` VARCHAR(255) NULL,
    ADD COLUMN `prescription_type` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `doctors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `registration_no` VARCHAR(50) NULL,
    `specialization` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctors_registration_no_key`(`registration_no`),
    INDEX `doctors_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospitals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(300) NULL,
    `phone` VARCHAR(20) NULL,
    `gstin` VARCHAR(15) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hospitals_gstin_key`(`gstin`),
    INDEX `hospitals_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `bills_doctor_id_idx` ON `bills`(`doctor_id`);

-- CreateIndex
CREATE INDEX `bills_hospital_id_idx` ON `bills`(`hospital_id`);

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
