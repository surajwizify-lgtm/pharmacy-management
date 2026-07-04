export type Role = 'ADMIN' | 'PHARMACIST' | 'CASHIER';
export type MedicineStatus = 'ACTIVE' | 'DISCONTINUED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'OTHER';

export interface Batch {
  id: number;
  medicineId: number;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: string;
  sellingPrice: string;
  quantityAvailable: number;
  version: number;
  medicine?: Medicine;
}

export interface Medicine {
  id: number;
  name: string;
  manufacturer: string;
  category: string | null;
  barcode: string | null;
  hsnCode: string;
  gstPercentage: string;
  prescriptionRequired: boolean;
  status: MedicineStatus;
  version: number;
  batches: Batch[];
  totalStock?: number;
}

export interface BillItem {
  id: number;
  medicineId: number;
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
  medicine?: Medicine;
}

export interface Bill {
  id: number;
  billNumber: string;
  billDate: string;
  cashierId: number;
  customerName: string | null;
  customerPhone: string | null;
  customerGstin: string | null;
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
  active: boolean;
  createdAt: string;
}
