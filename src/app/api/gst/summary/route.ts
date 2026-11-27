// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function GET(req: NextRequest) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const from = searchParams.get('from');
//         const to = searchParams.get('to');

//         if (!from || !to) {
//             return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 });
//         }

//         const fromDate = new Date(from);
//         const toDate = new Date(to);
//         toDate.setDate(toDate.getDate() + 1);

//         const dateFilter = {
//             entryDate: {
//                 gte: fromDate,
//                 lt: toDate,
//             },
//         };

//         const outputFromBills = await prisma.gstLedgerEntry.aggregate({
//             where: { type: 'OUTPUT', billId: { not: null }, ...dateFilter },
//             _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
//         });
//         const outputFromSalesReturns = await prisma.gstLedgerEntry.aggregate({
//             where: { type: 'OUTPUT', returnId: { not: null }, ...dateFilter },
//             _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
//         });

//         const inputFromPurchases = await prisma.gstLedgerEntry.aggregate({
//             where: { type: 'INPUT', purchaseInvoiceId: { not: null }, ...dateFilter },
//             _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
//         });
//         const inputFromSupplierReturns = await prisma.gstLedgerEntry.aggregate({
//             where: { type: 'INPUT', supplierReturnId: { not: null }, ...dateFilter },
//             _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
//         });

//         const totalOutputGst =
//             Number(outputFromBills._sum.totalGst || 0) - Number(outputFromSalesReturns._sum.totalGst || 0);
//         const totalInputGst =
//             Number(inputFromPurchases._sum.totalGst || 0) - Number(inputFromSupplierReturns._sum.totalGst || 0);
//         const netPayable = totalOutputGst - totalInputGst;

//         return NextResponse.json({
//             from,
//             to,
//             totalOutputGst: Math.round(totalOutputGst * 100) / 100,
//             totalInputGst: Math.round(totalInputGst * 100) / 100,
//             netPayable: Math.round(netPayable * 100) / 100,
//             breakdown: {
//                 output: {
//                     cgst: Number(outputFromBills._sum.cgstAmount || 0) - Number(outputFromSalesReturns._sum.cgstAmount || 0),
//                     sgst: Number(outputFromBills._sum.sgstAmount || 0) - Number(outputFromSalesReturns._sum.sgstAmount || 0),
//                     igst: Number(outputFromBills._sum.igstAmount || 0) - Number(outputFromSalesReturns._sum.igstAmount || 0),
//                     taxableValue: Number(outputFromBills._sum.taxableValue || 0) - Number(outputFromSalesReturns._sum.taxableValue || 0),
//                 },
//                 input: {
//                     cgst: Number(inputFromPurchases._sum.cgstAmount || 0) - Number(inputFromSupplierReturns._sum.cgstAmount || 0),
//                     sgst: Number(inputFromPurchases._sum.sgstAmount || 0) - Number(inputFromSupplierReturns._sum.sgstAmount || 0),
//                     igst: Number(inputFromPurchases._sum.igstAmount || 0) - Number(inputFromSupplierReturns._sum.igstAmount || 0),
//                     taxableValue: Number(inputFromPurchases._sum.taxableValue || 0) - Number(inputFromSupplierReturns._sum.taxableValue || 0),
//                 },
//             },
//         });
//     } catch (err: any) {
//         return NextResponse.json({ error: err.message || 'Failed to compute GST summary' }, { status: 500 });
//     }
// }
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const pharmacyIdParam = searchParams.get('pharmacyId');

        if (!from || !to) {
            return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 });
        }

        // SUPER_ADMIN can optionally view any pharmacy's data via ?pharmacyId=
        // everyone else (ADMIN, PHARMACIST, CASHIER, ACCOUNTANT) is locked to their own pharmacy
        let pharmacyId: number;
        if (session.user.role === 'SUPER_ADMIN' && pharmacyIdParam) {
            pharmacyId = Number(pharmacyIdParam);
            if (Number.isNaN(pharmacyId)) {
                return NextResponse.json({ error: 'Invalid pharmacyId' }, { status: 400 });
            }
        } else {
            if (!session.user.pharmacyId) {
                return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
            }
            pharmacyId = session.user.pharmacyId;
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);

        const dateFilter = {
            pharmacyId,
            entryDate: {
                gte: fromDate,
                lt: toDate,
            },
        };

        const outputFromBills = await prisma.gstLedgerEntry.aggregate({
            where: { type: 'OUTPUT', billId: { not: null }, ...dateFilter },
            _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        });
        const outputFromSalesReturns = await prisma.gstLedgerEntry.aggregate({
            where: { type: 'OUTPUT', returnId: { not: null }, ...dateFilter },
            _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        });

        const inputFromPurchases = await prisma.gstLedgerEntry.aggregate({
            where: { type: 'INPUT', purchaseInvoiceId: { not: null }, ...dateFilter },
            _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        });
        const inputFromSupplierReturns = await prisma.gstLedgerEntry.aggregate({
            where: { type: 'INPUT', supplierReturnId: { not: null }, ...dateFilter },
            _sum: { totalGst: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true },
        });

        const totalOutputGst =
            Number(outputFromBills._sum.totalGst || 0) - Number(outputFromSalesReturns._sum.totalGst || 0);
        const totalInputGst =
            Number(inputFromPurchases._sum.totalGst || 0) - Number(inputFromSupplierReturns._sum.totalGst || 0);
        const netPayable = totalOutputGst - totalInputGst;

        return NextResponse.json({
            from,
            to,
            pharmacyId,
            totalOutputGst: Math.round(totalOutputGst * 100) / 100,
            totalInputGst: Math.round(totalInputGst * 100) / 100,
            netPayable: Math.round(netPayable * 100) / 100,
            breakdown: {
                output: {
                    cgst: Number(outputFromBills._sum.cgstAmount || 0) - Number(outputFromSalesReturns._sum.cgstAmount || 0),
                    sgst: Number(outputFromBills._sum.sgstAmount || 0) - Number(outputFromSalesReturns._sum.sgstAmount || 0),
                    igst: Number(outputFromBills._sum.igstAmount || 0) - Number(outputFromSalesReturns._sum.igstAmount || 0),
                    taxableValue: Number(outputFromBills._sum.taxableValue || 0) - Number(outputFromSalesReturns._sum.taxableValue || 0),
                },
                input: {
                    cgst: Number(inputFromPurchases._sum.cgstAmount || 0) - Number(inputFromSupplierReturns._sum.cgstAmount || 0),
                    sgst: Number(inputFromPurchases._sum.sgstAmount || 0) - Number(inputFromSupplierReturns._sum.sgstAmount || 0),
                    igst: Number(inputFromPurchases._sum.igstAmount || 0) - Number(inputFromSupplierReturns._sum.igstAmount || 0),
                    taxableValue: Number(inputFromPurchases._sum.taxableValue || 0) - Number(inputFromSupplierReturns._sum.taxableValue || 0),
                },
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to compute GST summary' }, { status: 500 });
    }
}