// import { z } from 'zod';
// import { Role, MedicineStatus, PaymentMethod } from '@prisma/client';

// // ---------- auth ----------
// export const loginSchema = z.object({
//   username: z.string().min(1),
//   password: z.string().min(1),
// });

// // ---------- users ----------
// export const createUserSchema = z.object({
//   username: z.string().min(1),
//   password: z.string().min(8),
//   fullName: z.string().min(1),
//   role: z.nativeEnum(Role),
// });

// // ---------- medicines ----------
// export const createMedicineSchema = z.object({
//   name: z.string().min(1),
//   manufacturer: z.string().min(1),
//   category: z.string().optional(),
//   barcode: z.string().optional(),
//   hsnCode: z.string().min(1),
//   gstPercentage: z.number().min(0).max(28),
//   prescriptionRequired: z.boolean().optional(),
// });

// export const updateMedicineSchema = createMedicineSchema.partial();

// export const medicineQuerySchema = z.object({
//   search: z.string().optional(),
//   status: z.nativeEnum(MedicineStatus).optional(),
// });

// // ---------- batches ----------
// export const createBatchSchema = z.object({
//   medicineId: z.number().int(),
//   batchNumber: z.string().min(1),
//   expiryDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
//   purchasePrice: z.number().positive(),
//   sellingPrice: z.number().positive(),
//   quantityAvailable: z.number().int().min(0),
// });

// export const updateStockSchema = z.object({
//   quantityDelta: z.number().int(),
//   version: z.number().int(),
// });

// // ---------- billing ----------
// export const billItemInputSchema = z.object({
//   medicineId: z.number().int(),
//   quantity: z.number().int().positive(),
//   batchId: z.number().int().optional(),
// });

// export const createBillSchema = z.object({
//   items: z.array(billItemInputSchema).min(1),
//   customerName: z.string().optional(),
//   customerPhone: z.string().optional(),
//   customerGstin: z
//     .string()
//     .regex(/^[0-9A-Z]{15}$/, 'GSTIN must be 15 alphanumeric characters')
//     .optional(),
//   isInterState: z.boolean().optional(),
// });

// export const recordPaymentSchema = z.object({
//   amount: z.number().positive(),
//   method: z.nativeEnum(PaymentMethod),
// });

import { z } from 'zod';
import { Role, MedicineStatus, PaymentMethod, GstType } from '@prisma/client';

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
// export const createMedicineSchema = z.object({
//   name: z.string().min(1),
//   manufacturer: z.string().min(1),
//   category: z.string().optional(),
//   barcode: z.string().optional(),
//   hsnCode: z.string().min(1),
//   gstPercentage: z.number().min(0).max(28),
//   prescriptionRequired: z.boolean().optional(),
// });

// export const updateMedicineSchema = createMedicineSchema.partial();


export const createMedicineSchema = z.object({
  name: z.string().min(1),
  manufacturer: z.string().min(1),
  category: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string().min(1),
  gstPercentage: z.number().min(0).max(28),
  gstType: z.nativeEnum(GstType).optional(),
  prescriptionRequired: z.boolean().optional(),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const medicineQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(MedicineStatus).optional(),
});

// ---------- batches ----------
// export const createBatchSchema = z.object({
//   medicineId: z.number().int(),
//   batchNumber: z.string().min(1),
//   expiryDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
//   purchasePrice: z.number().positive(),
//   sellingPrice: z.number().positive(),
//   quantityAvailable: z.number().int().min(0),
// });
export const createBatchSchema = z.object({
  medicineId: z.number().int(),
  batchNumber: z.string().min(1),
  expiryDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  quantityAvailable: z.number().int().min(0),
  location: z.string().max(50).optional(),
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

export const createBillSchema = z
  .object({
    items: z.array(billItemInputSchema).min(1),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerGstin: z
      .string()
      .regex(/^[0-9A-Z]{15}$/, 'GSTIN must be 15 alphanumeric characters')
      .optional(),
    isInterState: z.boolean().optional(),

    // Referring doctor: either pick an existing one (doctorId) or
    // type a new/unmatched name (doctorName) — resolved in createBill().
    doctorId: z.number().int().optional(),
    doctorName: z.string().min(1).optional(),

    // Referring hospital: same find-or-create pattern as doctor.
    hospitalId: z.number().int().optional(),
    hospitalName: z.string().min(1).optional(),

    prescriptionFile: z.string().optional(),
    prescriptionName: z.string().optional(),
    prescriptionType: z.string().optional(),
  })
  .refine((d) => !(d.doctorId && d.doctorName), {
    message: 'Provide either doctorId or doctorName, not both',
    path: ['doctorName'],
  })
  .refine((d) => !(d.hospitalId && d.hospitalName), {
    message: 'Provide either hospitalId or hospitalName, not both',
    path: ['hospitalName'],
  });

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
});