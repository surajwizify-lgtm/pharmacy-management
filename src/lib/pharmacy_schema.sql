-- ============================================================================
-- PHARMACY MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Engine: MySQL/MariaDB (import directly via phpMyAdmin)
-- Frontend/API: Next.js (use mysql2 / Prisma / Drizzle against this schema)
-- ============================================================================
-- Design notes:
-- 1. Distributor + Supplier merged into one `vendors` table (type column)
--    since in almost every real pharmacy they are the same kind of party.
--    If you truly need them separate, split the table and duplicate the FK.
-- 2. Batch-wise stock lives in ONE table `batch_stock`. Purchase INSERTs
--    into it, Sales/Returns UPDATE the quantity. Do this inside a DB
--    transaction in your Next.js API route (not in DB triggers) so you can
--    handle FEFO batch selection and error handling in application code.
-- 3. GST is not a separate data-entry table — it's read off
--    purchase_invoice_items and bill_items via the two VIEWs at the bottom.
-- 4. All money columns use DECIMAL, never FLOAT.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. USERS & ROLES
-- ============================================================================

CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  phone           VARCHAR(20),
  email           VARCHAR(150) UNIQUE,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin','pharmacist','cashier','accountant') NOT NULL DEFAULT 'cashier',
  status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  last_login_at   DATETIME NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 2. MASTERS: MANUFACTURER, VENDOR (DISTRIBUTOR/SUPPLIER), CATEGORY, PRODUCT
-- ============================================================================

CREATE TABLE manufacturers (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  contact_person   VARCHAR(150),
  phone            VARCHAR(20),
  email            VARCHAR(150),
  address          TEXT,
  gstin            VARCHAR(20),
  drug_license_no  VARCHAR(50),
  status           ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE vendors (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  type             ENUM('distributor','supplier','both') NOT NULL DEFAULT 'both',
  contact_person   VARCHAR(150),
  phone            VARCHAR(20),
  email            VARCHAR(150),
  address          TEXT,
  gstin            VARCHAR(20),
  drug_license_no  VARCHAR(50),
  payment_terms    VARCHAR(100),
  bank_details     TEXT,
  opening_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status           ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Which manufacturers a given vendor carries (many-to-many)
CREATE TABLE vendor_manufacturers (
  vendor_id        INT UNSIGNED NOT NULL,
  manufacturer_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (vendor_id, manufacturer_id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(100) NOT NULL UNIQUE,
  parent_id           INT UNSIGNED NULL,
  -- Defines extra fields the frontend should show for products in this
  -- category, e.g. [{"key":"strength","label":"Strength","type":"text"}]
  -- for Tablets, or [{"key":"size","label":"Size","type":"text"}] for
  -- Surgical. Actual per-product values live in products.attributes.
  attribute_template  JSON NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE products (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  generic_name     VARCHAR(200),
  category_id      INT UNSIGNED,
  manufacturer_id  INT UNSIGNED,
  unit             VARCHAR(30) NOT NULL DEFAULT 'strip',
  pack_size        VARCHAR(30),
  hsn_code         VARCHAR(20),
  gst_percent      DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  default_mrp      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reorder_level    INT NOT NULL DEFAULT 10,
  rack_location    VARCHAR(50),
  schedule_type    ENUM('OTC','H','H1','X') NOT NULL DEFAULT 'OTC',
  tracks_expiry    TINYINT(1) NOT NULL DEFAULT 1,   -- 0 for non-expiring items like equipment
  attributes       JSON NULL,                       -- type-specific fields, keyed per category.attribute_template
  status           ENUM('active','inactive','discontinued') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE SET NULL,
  INDEX idx_product_name (name)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. INVENTORY: BATCH-WISE STOCK (the core linking table)
-- ============================================================================

CREATE TABLE batch_stock (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id        INT UNSIGNED NOT NULL,
  batch_no          VARCHAR(50) NOT NULL,
  expiry_date       DATE NOT NULL,
  purchase_rate     DECIMAL(10,2) NOT NULL,
  mrp               DECIMAL(10,2) NOT NULL,
  current_quantity  INT NOT NULL DEFAULT 0,
  rack_location     VARCHAR(50),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_product_batch (product_id, batch_no, expiry_date),
  INDEX idx_expiry (expiry_date),
  INDEX idx_stock_lookup (product_id, current_quantity)
) ENGINE=InnoDB;

CREATE TABLE stock_adjustments (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id         INT UNSIGNED NOT NULL,
  batch_stock_id     INT UNSIGNED NOT NULL,
  quantity_adjusted  INT NOT NULL,                 -- positive or negative
  reason             ENUM('damaged','expired_writeoff','theft','stock_count_correction','other') NOT NULL,
  notes              VARCHAR(255),
  approved_by        INT UNSIGNED NOT NULL,
  adjustment_date    DATE NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_stock_id) REFERENCES batch_stock(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 4. PURCHASE MODULE
-- ============================================================================

CREATE TABLE purchase_orders (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_number              VARCHAR(50) NOT NULL UNIQUE,
  vendor_id              INT UNSIGNED NOT NULL,
  order_date             DATE NOT NULL,
  expected_delivery_date DATE,
  status                 ENUM('draft','sent','partially_received','received','cancelled') NOT NULL DEFAULT 'draft',
  created_by             INT UNSIGNED NOT NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE purchase_order_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_id           INT UNSIGNED NOT NULL,
  product_id      INT UNSIGNED NOT NULL,
  quantity        INT NOT NULL,
  expected_rate   DECIMAL(10,2),
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE purchase_invoices (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number    VARCHAR(50) NOT NULL,        -- vendor's invoice number
  grn_number        VARCHAR(50) NOT NULL UNIQUE, -- internal auto number
  vendor_id         INT UNSIGNED NOT NULL,
  po_id             INT UNSIGNED NULL,
  invoice_date      DATE NOT NULL,
  total_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status    ENUM('paid','partial','due') NOT NULL DEFAULT 'due',
  payment_mode      ENUM('cash','bank','upi','cheque','credit') NOT NULL DEFAULT 'credit',
  amount_paid       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  attachment_path   VARCHAR(255),
  created_by        INT UNSIGNED NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_invoice_date (invoice_date)
) ENGINE=InnoDB;

CREATE TABLE purchase_invoice_items (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_invoice_id INT UNSIGNED NOT NULL,
  product_id          INT UNSIGNED NOT NULL,
  batch_no            VARCHAR(50) NOT NULL,
  mfg_date            DATE,
  expiry_date         DATE NOT NULL,
  quantity            INT NOT NULL,
  free_quantity       INT NOT NULL DEFAULT 0,
  purchase_rate       DECIMAL(10,2) NOT NULL,
  mrp                 DECIMAL(10,2) NOT NULL,
  discount_percent    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  gst_percent         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  hsn_code            VARCHAR(20),
  amount              DECIMAL(12,2) NOT NULL,      -- line total incl. GST
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_pii_product_batch (product_id, batch_no)
) ENGINE=InnoDB;

CREATE TABLE purchase_returns (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_number          VARCHAR(50) NOT NULL UNIQUE,
  purchase_invoice_id    INT UNSIGNED NOT NULL,
  vendor_id              INT UNSIGNED NOT NULL,
  return_date            DATE NOT NULL,
  reason                 ENUM('expired','damaged','wrong_item','excess_supply','other') NOT NULL,
  refund_type            ENUM('cash_refund','credit_note','adjust_next_bill') NOT NULL,
  total_amount           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_by             INT UNSIGNED NOT NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE purchase_return_items (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_return_id INT UNSIGNED NOT NULL,
  product_id         INT UNSIGNED NOT NULL,
  batch_no           VARCHAR(50) NOT NULL,
  quantity           INT NOT NULL,
  rate               DECIMAL(10,2) NOT NULL,
  gst_percent        DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  amount             DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE vendor_payments (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_id             INT UNSIGNED NOT NULL,
  purchase_invoice_id   INT UNSIGNED NULL,
  amount                DECIMAL(12,2) NOT NULL,
  payment_date          DATE NOT NULL,
  mode                  ENUM('cash','bank','upi','cheque') NOT NULL,
  reference_no          VARCHAR(100),
  created_by            INT UNSIGNED NOT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
  FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 5. SALES MODULE
-- ============================================================================

CREATE TABLE customers (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  phone            VARCHAR(20),
  address          TEXT,
  dob              DATE NULL,
  gstin            VARCHAR(20),
  credit_limit     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status           ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE doctors (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  clinic_name      VARCHAR(150),
  specialization   VARCHAR(100),
  phone            VARCHAR(20),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE bills (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bill_number       VARCHAR(50) NOT NULL UNIQUE,
  bill_date         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_id       INT UNSIGNED NULL,          -- NULL = walk-in
  doctor_id         INT UNSIGNED NULL,
  biller_id         INT UNSIGNED NOT NULL,
  subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cgst_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sgst_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  igst_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  round_off         DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  grand_total       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_mode      ENUM('cash','card','upi','credit','split') NOT NULL DEFAULT 'cash',
  payment_status    ENUM('paid','partial','due') NOT NULL DEFAULT 'paid',
  amount_paid       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  prescription_path VARCHAR(255),
  status            ENUM('completed','held','cancelled') NOT NULL DEFAULT 'completed',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (biller_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_bill_date (bill_date),
  INDEX idx_bill_status (status, payment_status)
) ENGINE=InnoDB;

CREATE TABLE bill_items (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bill_id           INT UNSIGNED NOT NULL,
  product_id        INT UNSIGNED NOT NULL,
  batch_stock_id    INT UNSIGNED NOT NULL,       -- exact batch sold (FEFO choice)
  quantity          INT NOT NULL,
  rate              DECIMAL(10,2) NOT NULL,      -- MRP at time of sale
  discount_percent  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  gst_percent       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  cgst_amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sgst_amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  igst_amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  line_total        DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_stock_id) REFERENCES batch_stock(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales_returns (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_number  VARCHAR(50) NOT NULL UNIQUE,
  bill_id        INT UNSIGNED NOT NULL,
  return_date    DATE NOT NULL,
  reason         ENUM('wrong_product','customer_refusal','expired_at_sale','other') NOT NULL,
  refund_mode    ENUM('cash','adjust_next_bill','credit_note') NOT NULL,
  total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_by     INT UNSIGNED NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales_return_items (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sales_return_id   INT UNSIGNED NOT NULL,
  product_id        INT UNSIGNED NOT NULL,
  batch_stock_id    INT UNSIGNED NOT NULL,
  quantity          INT NOT NULL,
  rate              DECIMAL(10,2) NOT NULL,
  gst_percent       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  amount            DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sales_return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_stock_id) REFERENCES batch_stock(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE customer_payments (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT UNSIGNED NOT NULL,
  bill_id        INT UNSIGNED NULL,
  amount         DECIMAL(12,2) NOT NULL,
  payment_date   DATE NOT NULL,
  mode           ENUM('cash','card','upi','bank') NOT NULL,
  reference_no   VARCHAR(100),
  created_by     INT UNSIGNED NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 6. GST TRACKING (period summary — actual figures come from the VIEWs below)
-- ============================================================================

CREATE TABLE gst_periods (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL,
  amount_paid    DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- manually entered once filed with govt
  status         ENUM('pending','filed') NOT NULL DEFAULT 'pending',
  filed_date     DATE NULL,
  filed_by       INT UNSIGNED NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_period (period_start, period_end)
) ENGINE=InnoDB;

-- ============================================================================
-- 7. SYSTEM: NOTIFICATIONS, AUDIT LOG, SETTINGS
-- ============================================================================

CREATE TABLE notifications (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type             ENUM('low_stock','expiry','payment_due') NOT NULL,
  reference_table  VARCHAR(50) NOT NULL,
  reference_id     INT UNSIGNED NOT NULL,
  message          VARCHAR(255) NOT NULL,
  is_read          TINYINT(1) NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_unread (is_read)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  action       ENUM('create','update','delete','cancel') NOT NULL,
  table_name   VARCHAR(50) NOT NULL,
  record_id    INT UNSIGNED NOT NULL,
  old_value    JSON NULL,
  new_value    JSON NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_audit_table_record (table_name, record_id)
) ENGINE=InnoDB;

CREATE TABLE settings (
  `key`         VARCHAR(100) PRIMARY KEY,
  `value`       TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 8. VIEWS — GST Ledger (auto-derived, no manual entry)
-- ============================================================================

CREATE OR REPLACE VIEW v_purchase_gst AS
SELECT
  pi.id               AS purchase_invoice_id,
  pi.invoice_date,
  v.name              AS vendor_name,
  v.gstin             AS vendor_gstin,
  pii.hsn_code,
  SUM(pii.amount / (1 + pii.gst_percent/100)) AS taxable_value,
  SUM(pii.amount - (pii.amount / (1 + pii.gst_percent/100))) AS total_gst,
  pii.gst_percent
FROM purchase_invoice_items pii
JOIN purchase_invoices pi ON pi.id = pii.purchase_invoice_id
JOIN vendors v ON v.id = pi.vendor_id
GROUP BY pi.id, pii.hsn_code, pii.gst_percent;

CREATE OR REPLACE VIEW v_sales_gst AS
SELECT
  b.id                AS bill_id,
  b.bill_date,
  c.name              AS customer_name,
  c.gstin             AS customer_gstin,
  p.hsn_code,
  bi.gst_percent,
  SUM(bi.line_total / (1 + bi.gst_percent/100)) AS taxable_value,
  SUM(bi.cgst_amount + bi.sgst_amount + bi.igst_amount) AS total_gst
FROM bill_items bi
JOIN bills b ON b.id = bi.bill_id
JOIN products p ON p.id = bi.product_id
LEFT JOIN customers c ON c.id = b.customer_id
WHERE b.status = 'completed'
GROUP BY b.id, p.hsn_code, bi.gst_percent;

-- Handy view: current stock per product with nearest expiry surfaced first
CREATE OR REPLACE VIEW v_current_stock AS
SELECT
  bs.id AS batch_stock_id,
  p.id AS product_id,
  p.name AS product_name,
  bs.batch_no,
  bs.expiry_date,
  bs.mrp,
  bs.current_quantity
FROM batch_stock bs
JOIN products p ON p.id = bs.product_id
WHERE bs.current_quantity > 0
ORDER BY p.name, bs.expiry_date ASC;
