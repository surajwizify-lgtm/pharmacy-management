import { Prisma, GstLedgerType } from '@prisma/client';

type LedgerInput = {
    type: GstLedgerType;
    taxableValue: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    totalGst: number;
    purchaseInvoiceId?: number;
    supplierReturnId?: number;
    billId?: number;
    returnId?: number;
};

// Call this INSIDE an existing prisma.$transaction (pass `tx`), so the
// ledger entry commits atomically with the invoice/bill/return it belongs to.
export async function createGstLedgerEntry(tx: Prisma.TransactionClient, input: LedgerInput) {
    return tx.gstLedgerEntry.create({
        data: {
            type: input.type,
            taxableValue: input.taxableValue,
            cgstAmount: input.cgstAmount ?? 0,
            sgstAmount: input.sgstAmount ?? 0,
            igstAmount: input.igstAmount ?? 0,
            totalGst: input.totalGst,
            purchaseInvoiceId: input.purchaseInvoiceId ?? null,
            supplierReturnId: input.supplierReturnId ?? null,
            billId: input.billId ?? null,
            returnId: input.returnId ?? null,
        },
    });
}