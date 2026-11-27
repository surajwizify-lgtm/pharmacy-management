import { ItemRow } from "@/types/purchaseOrder/perchaseOrderType";

export const EMPTY_ITEM: ItemRow = {
    name: '',
    productId: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    quantity: '',
    freeQuantity: '0',
    purchaseRate: '',
    mrp: '',
    sellingPrice: '',
    discountPercent: '0',
    hsnCode: '',
    gstPercentage: '',
    location: '',
};