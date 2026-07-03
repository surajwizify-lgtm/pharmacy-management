import { z } from 'zod';
import { Role, MedicineStatus, PaymentMethod } from '@prisma/client';

// ---------- auth ----------
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ---------- users ----------
export const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.nativeEnum(Role),
});

// ---------- medicines ----------
export const createMedicineSchema = z.object({
  name: z.string().min(1),
  manufacturer: z.string().min(1),
  category: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string().min(1),
  gstPercentage: z.number().min(0).max(28),
  prescriptionRequired: z.boolean().optional(),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const medicineQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(MedicineStatus).optional(),
});

// ---------- batches ----------
export const createBatchSchema = z.object({
  medicineId: z.number().int(),
  batchNumber: z.string().min(1),
  expiryDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  quantityAvailable: z.number().int().min(0),
});

export const updateStockSchema = z.object({
  quantityDelta: z.number().int(),
  version: z.number().int(),
});

// ---------- billing ----------
export const billItemInputSchema = z.object({
  medicineId: z.number().int(),
  quantity: z.number().int().positive(),
  batchId: z.number().int().optional(),
});

export const createBillSchema = z.object({
  items: z.array(billItemInputSchema).min(1),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerGstin: z
    .string()
    .regex(/^[0-9A-Z]{15}$/, 'GSTIN must be 15 alphanumeric characters')
    .optional(),
  isInterState: z.boolean().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
});
