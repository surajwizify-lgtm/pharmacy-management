import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";

type Props = {
    open: boolean;
    invoice: any;
    onClose: () => void;
    onSuccess: () => Promise<void>;
};
export default function RecordPaymentModal({
    open,
    invoice,
    onClose,
    onSuccess,
}: Props) {
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMode: 'cash',
        referenceNo: '',
        notes: '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');




    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError('');

        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            setError('Enter a valid amount');
            return;
        }

        setSaving(true);

        try {
            await apiFetch(`/api/purchase-invoices/${invoice.id}/payments`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: Number(paymentForm.amount),
                    paymentMode: paymentForm.paymentMode,
                    referenceNo: paymentForm.referenceNo || undefined,
                    notes: paymentForm.notes || undefined,
                }),
            });

            await onSuccess();
            onClose();

        } catch (err: any) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : 'Something went wrong'
            );
        } finally {
            setSaving(false);
        }
    };
    useEffect(() => {
        if (!invoice) return;

        setPaymentForm({
            // supplierId: invoice.supplierId,
            // purchaseInvoiceId: invoice.id,
            amount: Number(invoice.remainingAmount).toFixed(2),
            paymentMode: "cash",
            referenceNo: "",
            notes: "",
        });
    }, [invoice]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

                <div className="border-b p-6">
                    <h2 className="text-lg font-semibold">
                        Record Payment
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {invoice?.supplier?.name}
                    </p>

                    <p className="text-sm text-slate-500">
                        Invoice: {invoice?.invoiceNumber}
                    </p>

                    <p className="font-semibold text-red-600">
                        Balance Due ₹{Number(invoice?.remainingAmount ?? 0).toFixed(2)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">

                    {/* Amount */}
                    <div>
                        <label className="label">Amount</label>

                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            required
                            value={paymentForm.amount}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    amount: e.target.value,
                                })
                            }
                        />
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="label">Payment Mode</label>

                        <select
                            className="input"
                            value={paymentForm.paymentMode}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    paymentMode: e.target.value,
                                })
                            }
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>

                    {/* Reference */}
                    <div>
                        <label className="label">Reference No.</label>

                        <input
                            className="input"
                            value={paymentForm.referenceNo}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    referenceNo: e.target.value,
                                })
                            }
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Notes</label>

                        <textarea
                            rows={3}
                            className="input"
                            value={paymentForm.notes}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    notes: e.target.value,
                                })
                            }
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Payment"}
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
}