"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DetailPageHeader from "@/components/common/DetailPageHeader";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Container from "@/components/common/Container";
import PrintBillButton from "@/components/billing/PrintBillButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type PaymentMethod = "CASH" | "CARD" | "UPI" | "OTHER";

type Payment = {
    id: number;
    amount: string;
    method: PaymentMethod;
    paidAt: string;
};

type BillRow = {
    id: number;
    billNumber: string;
    billDate: string;
    totalAmount: string;
    paymentStatus: "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED";
    cancelled: boolean;
    payments: Payment[];
    billItems: { id: number }[];
};

type CustomerDetail = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    gstin: string | null;
    active: boolean;
    bills: BillRow[];
};

function billPaid(bill: BillRow) {
    return bill.payments.reduce((sum, p) => sum + Number(p.amount), 0);
}
function billDue(bill: BillRow) {
    return Math.max(Number(bill.totalAmount) - billPaid(bill), 0);
}

const statusBadge: Record<BillRow["paymentStatus"], string> = {
    PAID: "bg-secondary-100 text-secondary-800",
    PARTIALLY_PAID: "bg-amber-100 text-amber-700",
    PENDING: "bg-neutral-100 text-neutral-600",
    REFUNDED: "bg-purple-100 text-purple-700",
};

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [customer, setCustomer] = useState<CustomerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [payModalOpen, setPayModalOpen] = useState(false);
    const [payBillId, setPayBillId] = useState<number | "">("");
    const [payAmount, setPayAmount] = useState("");
    const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
    const [payError, setPayError] = useState<string | null>(null);
    const [paySaving, setPaySaving] = useState(false);

    const fetchCustomer = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/customers/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load customer");
            setCustomer(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchCustomer();
    }, [id, fetchCustomer]);

    function openPayModal(billId?: number) {
        setPayBillId(billId ?? "");
        setPayAmount("");
        setPayMethod("CASH");
        setPayError(null);
        setPayModalOpen(true);
    }

    const dueBills = (customer?.bills ?? []).filter((b) => !b.cancelled && billDue(b) > 0);

    useEffect(() => {
        // Prefill amount with the selected bill's outstanding due
        if (payBillId && customer) {
            const bill = customer.bills.find((b) => b.id === payBillId);
            if (bill) setPayAmount(billDue(bill).toFixed(2));
        }
    }, [payBillId, customer]);

    async function handleRecordPayment() {
        if (!payBillId) {
            setPayError("Select a bill to apply this payment to");
            return;
        }
        const amt = Number(payAmount);
        if (!amt || amt <= 0) {
            setPayError("Enter a valid amount");
            return;
        }
        const bill = customer?.bills.find((b) => b.id === payBillId);
        if (bill && amt > billDue(bill) + 0.01) {
            setPayError(`Amount exceeds the due amount of ₹${billDue(bill).toFixed(2)} for this bill`);
            return;
        }

        setPaySaving(true);
        setPayError(null);
        try {
            const res = await fetch(`/api/bills/${payBillId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amt, method: payMethod }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || "Failed to record payment");

            setPayModalOpen(false);
            fetchCustomer();
        } catch (err: any) {
            setPayError(err.message);
        } finally {
            setPaySaving(false);
        }
    }

    if (loading) {
        return <div className="p-6 text-sm text-neutral-400">Loading customer…</div>;
    }
    if (error || !customer) {
        return (

            <DetailPageHeader
                backHref="/products"
                backLabel="Back to products"
                title={customer?.name || ""}
                subtitle={
                    <>
                        {customer?.address || ""}
                    </>
                }
                status={{
                    label: 'status',
                    active: true,
                }}
                actions={
                    true && (
                        <Button
                            variant={'outline'}
                            onClick={(() => { })}
                        // className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    )
                }
            />
        );
    }

    const activeBills = customer.bills.filter((b) => !b.cancelled);
    const totalBilled = activeBills.reduce((s, b) => s + Number(b.totalAmount), 0);
    const totalPaid = activeBills.reduce((s, b) => s + billPaid(b), 0);
    const totalDue = totalBilled - totalPaid;

    return (
        <div>
            <DetailPageHeader
                backHref="/products"
                backLabel="Back to products"
                title={customer?.name || ""}
                subtitle={
                    <div className="grid w-full gap-5 grid-cols-4">
                        <span>{customer?.address || ""}</span>
                        <span>{customer.phone} || +91</span>
                        <span>{customer.email}|| abc@gmail.com</span>
                        <span>GSTIN: {customer.gstin}</span>



                    </div>
                }
                status={{
                    label: 'status',
                    active: true,
                }}
                actions={
                    true && (
                        <Button
                            variant={'outline'}
                            onClick={(() => { })}
                        // className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    )
                }
            />
            <Container>
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-neutral-400">Total Billed</p>
                        <p className="text-xl font-semibold text-neutral-800">₹{totalBilled.toFixed(2)}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{activeBills.length} bill(s)</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <p className="text-xs text-neutral-400">Total Paid</p>
                        <p className="text-xl font-semibold text-secondary-600">₹{totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-neutral-400">Amount Due</p>
                            {totalDue > 0 && (
                                <button
                                    onClick={() => openPayModal()}
                                    className="text-xs font-medium text-primary-600 hover:underline"
                                >
                                    + Add Payment
                                </button>
                            )}
                        </div>
                        <p className={`text-xl font-semibold ${totalDue > 0 ? "text-danger-600" : "text-neutral-800"}`}>
                            ₹{totalDue.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                        <h2 className="font-medium text-neutral-800">Bills</h2>
                        <span className="text-xs text-neutral-400">{customer.bills.length} total</span>
                    </div>
                    <Table className="table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bill No.</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Due</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {customer.bills.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No bills yet for this customer.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customer.bills.map((bill) => {
                                    const paid = billPaid(bill);
                                    const due = billDue(bill);

                                    return (
                                        <TableRow key={bill.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span>{bill.billNumber}</span>

                                                    {bill.cancelled && (
                                                        <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-600">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {new Date(bill.billDate).toLocaleDateString()}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                ₹{Number(bill.totalAmount).toFixed(2)}
                                            </TableCell>

                                            <TableCell className="text-right text-secondary-600">
                                                ₹{paid.toFixed(2)}
                                            </TableCell>

                                            <TableCell
                                                className={`text-right font-medium ${due > 0
                                                    ? "text-danger-600"
                                                    : "text-secondary-600"
                                                    }`}
                                            >
                                                ₹{due.toFixed(2)}
                                            </TableCell>

                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge[bill.paymentStatus]}`}
                                                >
                                                    {bill.paymentStatus.replace("_", " ")}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    {!bill.cancelled && due > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openPayModal(bill.id)}
                                                        >
                                                            Add Payment
                                                        </Button>
                                                    )}

                                                    <PrintBillButton
                                                        billId={bill.id}
                                                        label=""
                                                    />

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link href={`/billing/${bill.id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    {/* <table className="w-full text-sm">
                        <thead className="bg-neutral-100 text-neutral-500 text-left text-xs uppercase">
                            <tr>
                                <th className="px-4 py-2 font-medium">Bill No.</th>
                                <th className="px-4 py-2 font-medium">Date</th>
                                <th className="px-4 py-2 font-medium">Total</th>
                                <th className="px-4 py-2 font-medium">Paid</th>
                                <th className="px-4 py-2 font-medium">Due</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {customer.bills.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                                        No bills yet for this customer.
                                    </td>
                                </tr>
                            )}
                            {customer.bills.map((bill) => {
                                const paid = billPaid(bill);
                                const due = billDue(bill);
                                return (
                                    <tr key={bill.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-2 font-medium text-neutral-800">
                                            {bill.billNumber}
                                            {bill.cancelled && (
                                                <span className="ml-2 text-xs text-danger-500">(Cancelled)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-neutral-500">
                                            {new Date(bill.billDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-neutral-700">₹{Number(bill.totalAmount).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-secondary-600">₹{paid.toFixed(2)}</td>
                                        <td className={`px-4 py-2 font-medium ${due > 0 ? "text-danger-600" : "text-neutral-400"}`}>
                                            ₹{due.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[bill.paymentStatus]}`}
                                            >
                                                {bill.paymentStatus.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right space-x-3">
                                            {!bill.cancelled && due > 0 && (
                                                <button
                                                    onClick={() => openPayModal(bill.id)}
                                                    className="text-primary-600 hover:underline text-xs font-medium"
                                                >
                                                    Add Payment
                                                </button>
                                            )}
                                            <PrintBillButton
                                                billId={bill.id}
                                                label=""
                                            />
                                            <Link
                                                href={`/billing/${bill.id}`}
                                                className="text-neutral-500 hover:underline text-xs font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table> */}
                </div>
            </Container >
            {payModalOpen && (
                <div className="fixed inset-0 bg-overlay-black flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 border border-neutral-200">
                        <h2 className="text-lg font-semibold mb-4 text-neutral-900">Record Payment</h2>

                        {payError && (
                            <p className="text-danger-700 bg-danger-50 border border-danger-200 rounded-md px-3 py-2 text-sm mb-3">
                                {payError}
                            </p>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Bill *</label>
                                <select
                                    value={payBillId}
                                    onChange={(e) => setPayBillId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Select a bill with due amount…</option>
                                    {dueBills.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.billNumber} — due ₹{billDue(b).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                                {dueBills.length === 0 && (
                                    <p className="text-xs text-neutral-400 mt-1">No bills with outstanding dues.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Method</label>
                                <select
                                    value={payMethod}
                                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setPayModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={paySaving}
                                className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {paySaving ? "Saving…" : "Record Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}