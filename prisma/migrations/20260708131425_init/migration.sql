-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `role` ENUM('ADMIN', 'PHARMACIST', 'CASHIER', 'ACCOUNTANT') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `batch_number` VARCHAR(50) NOT NULL,
    `manufacture_date` DATE NULL,
    `expiry_date` DATE NOT NULL,
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `mrp` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `quantity_available` INTEGER NOT NULL,
    `location` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    INDEX `batches_product_id_idx`(`product_id`),
    INDEX `batches_expiry_date_idx`(`expiry_date`),
    INDEX `batches_batch_number_idx`(`batch_number`),
    INDEX `batches_product_id_expiry_date_idx`(`product_id`, `expiry_date`),
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
CREATE TABLE `purchase_order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `expected_rate` DECIMAL(10, 2) NOT NULL,

    INDEX `purchase_order_items_product_id_idx`(`product_id`),
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
CREATE TABLE `supplier_returns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `return_number` VARCHAR(191) NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `purchase_invoice_id` INTEGER NULL,
    `reason` VARCHAR(191) NULL,
    `refund_type` VARCHAR(191) NOT NULL DEFAULT 'credit_note',
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `total_gst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `supplier_returns_return_number_key`(`return_number`),
    INDEX `supplier_returns_supplier_id_idx`(`supplier_id`),
    INDEX `supplier_returns_purchase_invoice_id_idx`(`purchase_invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_return_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier_return_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `gst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(12, 2) NOT NULL,

    INDEX `supplier_return_items_batch_id_idx`(`batch_id`),
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

-- CreateTable
CREATE TABLE `bills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bill_number` VARCHAR(50) NOT NULL,
    `bill_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cashier_id` INTEGER NOT NULL,
    `customer_name` VARCHAR(200) NULL,
    `customer_phone` VARCHAR(20) NULL,
    `customer_gstin` VARCHAR(15) NULL,
    `doctor_id` INTEGER NULL,
    `hospital_id` INTEGER NULL,
    `prescription_file` VARCHAR(500) NULL,
    `prescription_name` VARCHAR(255) NULL,
    `prescription_type` VARCHAR(100) NULL,
    `is_inter_state` BOOLEAN NOT NULL DEFAULT false,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `total_cgst` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_sgst` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_igst` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_gst` DECIMAL(10, 2) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `cancelled` BOOLEAN NOT NULL DEFAULT false,
    `cancellation_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bills_bill_number_key`(`bill_number`),
    INDEX `bills_bill_date_idx`(`bill_date`),
    INDEX `bills_cashier_id_idx`(`cashier_id`),
    INDEX `bills_doctor_id_idx`(`doctor_id`),
    INDEX `bills_hospital_id_idx`(`hospital_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bill_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `batch_number` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `gst_percentage` DECIMAL(5, 2) NOT NULL,
    `cgst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `sgst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `igst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `gst_amount` DECIMAL(10, 2) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,

    INDEX `bill_items_bill_id_idx`(`bill_id`),
    INDEX `bill_items_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bill_id` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` ENUM('CASH', 'CARD', 'UPI', 'OTHER') NOT NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_bill_id_idx`(`bill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `returns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bill_id` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `total_refund` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `returns_bill_id_idx`(`bill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `return_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `return_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `refund_amount` DECIMAL(10, 2) NOT NULL,

    INDEX `return_items_return_id_idx`(`return_id`),
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

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entity_id` INTEGER NULL,
    `details` VARCHAR(191) NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_entity_entity_id_idx`(`entity`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gst_ledger_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('INPUT', 'OUTPUT') NOT NULL,
    `purchase_invoice_id` INTEGER NULL,
    `supplier_return_id` INTEGER NULL,
    `bill_id` INTEGER NULL,
    `return_id` INTEGER NULL,
    `taxable_value` DECIMAL(12, 2) NOT NULL,
    `cgst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `igst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_gst` DECIMAL(12, 2) NOT NULL,
    `entry_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gst_ledger_entries_purchase_invoice_id_key`(`purchase_invoice_id`),
    UNIQUE INDEX `gst_ledger_entries_supplier_return_id_key`(`supplier_return_id`),
    UNIQUE INDEX `gst_ledger_entries_bill_id_key`(`bill_id`),
    UNIQUE INDEX `gst_ledger_entries_return_id_key`(`return_id`),
    INDEX `gst_ledger_entries_type_idx`(`type`),
    INDEX `gst_ledger_entries_entry_date_idx`(`entry_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_manufacturer_id_fkey` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `bills` ADD CONSTRAINT `bills_cashier_id_fkey` FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_items` ADD CONSTRAINT `bill_items_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_items` ADD CONSTRAINT `bill_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_items` ADD CONSTRAINT `bill_items_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `returns` ADD CONSTRAINT `returns_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `return_items` ADD CONSTRAINT `return_items_return_id_fkey` FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `return_items` ADD CONSTRAINT `return_items_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_purchase_invoice_id_fkey` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_supplier_return_id_fkey` FOREIGN KEY (`supplier_return_id`) REFERENCES `supplier_returns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gst_ledger_entries` ADD CONSTRAINT `gst_ledger_entries_return_id_fkey` FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
