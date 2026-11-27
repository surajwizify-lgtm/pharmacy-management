export type Supplier = { id: number; name: string };

export type Product = {
    id: number;
    name: string;
    hsnCode: string | null;
    gstPercentage: number;
};

export type ItemRow = {
    name?: string,
    productId: number | '';
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    quantity: string;
    freeQuantity: string;
    purchaseRate: string;
    mrp: string;
    sellingPrice: string;
    discountPercent: string;
    hsnCode: string;
    gstPercentage: string;
    location: string;
};

export type Location = { id: number; name: string; code: string | null };
