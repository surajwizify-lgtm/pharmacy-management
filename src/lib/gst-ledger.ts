// import { Prisma, GstLedgerType } from '@prisma/client';

// type LedgerInput = {
//     type: GstLedgerType;
//     taxableValue: number;
//     cgstAmount?: number;
//     sgstAmount?: number;
//     igstAmount?: number;
//     totalGst: number;
//     purchaseInvoiceId?: number;
//     supplierReturnId?: number;
//     billId?: number;
//     returnId?: number;
//     pharmacyId: number;
// };

// // Call this INSIDE an existing prisma.$transaction (pass `tx`), so the
// // ledger entry commits atomically with the invoice/bill/return it belongs to.
// export async function createGstLedgerEntry(tx: Prisma.TransactionClient, input: LedgerInput) {
//     return tx.gstLedgerEntry.create({
//         data: {
//             type: input.type,
//             taxableValue: input.taxableValue,
//             cgstAmount: input.cgstAmount ?? 0,
//             sgstAmount: input.sgstAmount ?? 0,
//             igstAmount: input.igstAmount ?? 0,
//             totalGst: input.totalGst,
//             purchaseInvoiceId: input.purchaseInvoiceId ?? null,
//             supplierReturnId: input.supplierReturnId ?? null,
//             billId: input.billId ?? null,
//             returnId: input.returnId ?? null,
//             pharmacyId: input.pharmacyId,
//         },
//     });
// }

// lib/gst.ts
import { prisma } from '@/lib/prisma';
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
    pharmacyId: number;
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
            pharmacyId: input.pharmacyId,
        },
    });
}

export type GstSummary = {
    from: string;
    to: string;
    totalOutputGst: number;
    totalInputGst: number;
    netPayable: number;
    breakdown: {
        output: { cgst: number; sgst: number; igst: number; taxableValue: number };
        input: { cgst: number; sgst: number; igst: number; taxableValue: number };
    };
};

export async function computeGstSummary(pharmacyId: number, from: string, to: string): Promise<GstSummary> {
    const entries = await prisma.gstLedgerEntry.findMany({
        where: {
            pharmacyId,
            entryDate: {
                gte: new Date(from),
                lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
            },
        },
    });

    function sumBreakdown(rows: typeof entries) {
        return rows.reduce(
            (acc, r) => ({
                cgst: acc.cgst + Number(r.cgstAmount),
                sgst: acc.sgst + Number(r.sgstAmount),
                igst: acc.igst + Number(r.igstAmount),
                taxableValue: acc.taxableValue + Number(r.taxableValue),
            }),
            { cgst: 0, sgst: 0, igst: 0, taxableValue: 0 }
        );
    }

    const output = entries.filter((e) => e.type === 'OUTPUT');
    const input = entries.filter((e) => e.type === 'INPUT');

    const totalOutputGst = output.reduce((s, e) => s + Number(e.totalGst), 0);
    const totalInputGst = input.reduce((s, e) => s + Number(e.totalGst), 0);

    return {
        from,
        to,
        totalOutputGst,
        totalInputGst,
        netPayable: totalOutputGst - totalInputGst,
        breakdown: {
            output: sumBreakdown(output),
            input: sumBreakdown(input),
        },
    };
}