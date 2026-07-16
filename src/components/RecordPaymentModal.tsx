import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";

type Props = {
    open: boolean;
    invoice: any;
    onClose: () => void;
    onSuccess: () => Promise<void>;
};

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

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
            amount: Number(invoice.remainingAmount).toFixed(2),
            paymentMode: "cash",
            referenceNo: "",
            notes: "",
        });
    }, [invoice]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">

                <div className="border-b border-neutral-200 bg-primary-50 p-6">
                    <h2 className="text-lg font-semibold text-neutral-900">
                        Record Payment
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                        {invoice?.supplier?.name}
                    </p>

                    <p className="text-sm text-neutral-500">
                        Invoice: {invoice?.invoiceNumber}
                    </p>

                    <p className="mt-2 inline-flex rounded-md bg-danger-100 px-3 py-1 text-sm font-semibold text-danger-700">
                        Balance Due ₹{Number(invoice?.remainingAmount ?? 0).toFixed(2)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">

                    {/* Amount */}
                    <div>
                        <label className={labelClass}>Amount</label>

                        <input
                            className={inputClass}
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
                        <label className={labelClass}>Payment Mode</label>

                        <select
                            className={inputClass}
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
                        <label className={labelClass}>Reference No.</label>

                        <input
                            className={inputClass}
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
                        <label className={labelClass}>Notes</label>

                        <textarea
                            rows={3}
                            className={inputClass}
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
                        <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
                            <span className="text-sm font-medium text-danger-700">{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save Payment"}
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
}