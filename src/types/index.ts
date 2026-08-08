import { Pharmacy, Role } from "@prisma/client";

// export type Role = 'ADMIN' | 'PHARMACIST' | 'CASHIER' | 'SUPER_ADMIN';
export type productStatus = 'ACTIVE' | 'DISCONTINUED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'OTHER';

// export interface Batch {
//   id: number;
//   productId: number;
//   batchNumber: string;
//   expiryDate: string;
//   purchasePrice: string;
//   sellingPrice: string;
//   quantityAvailable: number;
//   version: number;
//   product?: product;
// }
export interface Batch {
  id: number;
  productId: number;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: string;
  sellingPrice: string;
  quantityAvailable: number;
  location?: string | null;   // add this
  createdAt: string;
  updatedAt: string;
  version: number;
}

// export interface product {
//   id: number;
//   name: string;
//   manufacturer: string;
//   category: string | null;
//   barcode: string | null;
//   hsnCode: string;
//   gstPercentage: string;
//   gstType: 'INCLUSIVE' | 'EXCLUSIVE';
//   prescriptionRequired: boolean;
//   status: productStatus;
//   mrp: number;
//   cp: number;
//   sp: number;
//   genericName?: string;
//   createdAt: string;
//   updatedAt: string;
//   version: number;
//   batches: Batch[];
//   totalStock?: number;
// }

export interface product {
  id: number;

  name: string;
  genericName: string | null;

  manufacturer: string | null;
  manufacturerId: number | null;

  categoryId: number | null;
  category: ProductCategory | null;

  barcode: string | null;
  hsnCode: string | null;

  gstPercentage: string;
  gstType: 'INCLUSIVE' | 'EXCLUSIVE';

  mrp: number;
  cp: number;
  sp: number;

  unit: string;
  packSize: string | null;
  defaultMrp: number;
  reorderLevel: number;
  rackLocation: string | null;

  scheduleType: string;

  prescriptionRequired: boolean;
  tracksExpiry: boolean;

  attributes: unknown | null;

  status: productStatus;

  createdAt: string;
  updatedAt: string;

  version: number;

  pharmacyId: number;

  batches: Batch[];

  totalStock?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  parentId: number | null;
}

export interface BillItem {
  id: number;
  productId: number;
  batchId: number;
  batchNumber: string;
  quantity: number;
  unitPrice: string;
  gstPercentage: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  gstAmount: string;
  totalAmount: string;
  product?: product;
}

// export interface Bill {
//   id: number;
//   billNumber: string;
//   billDate: string;
//   cashierId: number;
//   customerName: string | null;
//   customerPhone: string | null;
//   customerGstin: string | null;
//   ipOp: string | null;
//   doctorId: number | null;
//   hospitalId: number | null;
//   isInterState: boolean;
//   subtotal: string;
//   totalCgst: string;
//   totalSgst: string;
//   totalIgst: string;
//   totalGst: string;
//   totalAmount: string;
//   paymentStatus: PaymentStatus;
//   billItems: BillItem[];
//   payments?: { id: number; amount: string; method: PaymentMethod; paidAt: string }[];
//   cashier?: AppUser;
// }
export interface Bill {
  id: number;
  billNumber: string;
  billDate: string;
  cashierId: number;
  customerId: number | null;
  customer?: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    gstin: string | null;
  } | null;
  ipOp: string | null;
  doctorId: number | null;
  hospitalId: number | null;
  isInterState: boolean;
  subtotal: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalGst: string;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  billItems: BillItem[];
  payments?: { id: number; amount: string; method: PaymentMethod; paidAt: string }[];
  cashier?: AppUser;
  doctor?: { id: number; name: string; specialization: string | null; phone: string | null } | null;
  hospital?: { id: number; name: string; address: string | null; phone: string | null } | null;
}

export interface Doctor {
  id: number;
  name: string;
  registrationNo: string | null;
  specialization: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  pharmacy?: Pharmacy;
  active: boolean;
  createdAt: Date;
}
