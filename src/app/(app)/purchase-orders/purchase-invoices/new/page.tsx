'use client';

import Container from '@/components/common/Container';
import DetailPageHeader from '@/components/common/DetailPageHeader';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import Button from '@/components/Button';
import { Copy, Printer, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppSelect from '@/components/common/AppSelect';
import { DatePicker } from '@/components/ui/date-picker';
import { usePurchaseForm } from '@/hooks/usePurchaseForm';
import { Cell } from '@/components/purchase-orders/purchase-invoices/cell';

export default function NewPurchasePage() {
    const {
        locations,
        suppliers,
        products,
        supplierId, setSupplierId,
        // poNumber, 
        // setPoNumber,
        // orderDate, 
        // setOrderDate,
        // expectedDate, 
        // setExpectedDate,
        notes, setNotes,
        invoiceNumber, setInvoiceNumber,
        grnNumber, setGrnNumber,
        invoiceDate, setInvoiceDate,
        isInterState, setIsInterState,
        items,
        error,
        saving,
        lineCalcs,
        totals,
        updateItem,
        onProductChange,
        addItem,
        removeItem,
        duplicateItem,
        handleSubmit,
        search, setSearch,
        results, setResults,
    } = usePurchaseForm();
    return (
        <div className='h-screen overflow-clip'>
            <DetailPageHeader
            
                backHref="/products"
                backLabel="Back to products"
                title={'Create PO & Invoice Togather'}
                subtitle={
                    <>
                        {cn('')}
                    </>
                }
                status={{
                    label: "",
                    active: false,
                }}
                actions={
                    true && (
                        <div>

                        </div>
                    )
                }
            />
            <Container className="">
                <form className="flex h-[calc(100vh-7rem)] flex-col">

                    <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 border-b border-slate-200 py-3 lg:grid-cols-4 xl:grid-cols-8">
                        <div className="xl:col-span-2">
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Supplier</label>
                            <select
                                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                                required
                            >
                                <option value="">Select…</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* <div>
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">PO number</label>
                            <Cell value={poNumber} onChange={setPoNumber} required />
                        </div> */}
                        {/* <div>
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order date</label>
                            <Cell type="date" value={orderDate} onChange={setOrderDate} required />
                            <DatePicker
                                onChange={setOrderDate}
                                value={orderDate}
                            />
                        </div> */}
                        {/* <div>
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Expected date</label>
                            <Cell type="date" value={expectedDate} onChange={setExpectedDate} />
                        </div> */}
                        <div>
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Invoice no.</label>
                            <Cell value={invoiceNumber} onChange={setInvoiceNumber} required />
                        </div>
                        <div>
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">GRN number</label>
                            <Cell value={grnNumber} onChange={setGrnNumber} required />
                        </div>
                        <div>
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Invoice date</label>
                            <Cell type="date" value={invoiceDate} onChange={setInvoiceDate} required />
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Notes</label>
                            <Cell value={notes} onChange={setNotes} placeholder="Optional" />
                        </div>
                        <div className="flex items-end pb-1.5">
                            <label className="flex items-center gap-1.5 text-xs text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={isInterState}
                                    onChange={(e) => setIsInterState(e.target.checked)}
                                />
                                Inter-state (IGST)
                            </label>
                        </div>
                    </div>
                    <div>
                        <div className="relative col-span-3  w-full shrink-0">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <Input
                                id="productSearch"
                                // label=""
                                type="text"
                                placeholder="Search products"
                                className='pl-9'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {results.length > 0 && (
                                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-xl">
                                    {results.map((m) => (
                                        <div key={m.id}>
                                            {m.batches.map((b) => (
                                                <button
                                                    type="button"
                                                    key={`${m.id}-${b.batchNumber}`}
                                                    className="grid w-full grid-cols-6 items-center gap-2 border-b border-[var(--color-bg-tertiary)] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--color-bg-tertiary)]"
                                                    onClick={() => { onProductChange(0, Number(m.id)), setSearch('') }}
                                                >
                                                    <span className="col-span-3 truncate text-sm font-medium text-[var(--text-primary)]">{m.name}</span>
                                                    <span className="text-xs text-[var(--text-secondary)]">{"Batch " + b.batchNumber}</span>
                                                    <span className="text-xs text-[var(--text-secondary)]">{"Exp " + new Date(b.expiryDate).toLocaleDateString("en-IN")}</span>
                                                    <span className="justify-self-end rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-success)]">
                                                        {b.quantityAvailable} in stock
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col py-3">
                        <div className="mb-2 flex shrink-0 items-center justify-between">
                            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Items ({items.length})
                            </h2>
                            <button type="button" onClick={addItem} className="text-xs font-medium text-blue-600 hover:underline">
                                + Add line
                            </button>
                        </div>

                        <div className="max-h-[500px] overflow-auto ">
                            <Table className="table-fixed [&_td]:h-px [&_th]:border-border [&_th]:border [&_td]:p-0 w-full text-[11px]">
                                <TableHeader className="sticky top-0 z-10 ">
                                    <TableRow>
                                        <TableHead className="w-[14%]">Product</TableHead>
                                        <TableHead className="w-[8%]">Batch</TableHead>

                                        <TableHead className="w-[5%]">Qty</TableHead>
                                        <TableHead className="w-[5%]">Free</TableHead>
                                        <TableHead className="w-[7%]">Rate</TableHead>
                                        <TableHead className="w-[7%]">MRP</TableHead>
                                        <TableHead className="w-[7%]">Sell</TableHead>
                                        <TableHead className="w-[6%]">Disc %</TableHead>
                                        <TableHead className="w-[7%]">HSN</TableHead>
                                        <TableHead className="w-[6%]">GST %</TableHead>
                                        <TableHead className="w-[6%]">Rack</TableHead>
                                        <TableHead className="w-[8%]">Mfg</TableHead>
                                        <TableHead className="w-[8%]">Expiry</TableHead>
                                        <TableHead className="w-[9%]">Total</TableHead>
                                        <TableHead className="w-[4%] text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {items.map((it, i) => {
                                        const c = lineCalcs[i];

                                        return (
                                            <TableRow key={i}>
                                                <TableCell className='overflow-visible'>

                                                    {it.name}
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        value={it.batchNumber}
                                                        onChange={(e) =>
                                                            updateItem(i, { batchNumber: e.target.value })
                                                        }
                                                    />
                                                </TableCell>



                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        value={it.quantity}
                                                        onChange={(e) =>
                                                            updateItem(i, { quantity: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        value={it.freeQuantity}
                                                        onChange={(e) =>
                                                            updateItem(i, { freeQuantity: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={it.purchaseRate}
                                                        onChange={(e) =>
                                                            updateItem(i, { purchaseRate: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={it.mrp}
                                                        onChange={(e) =>
                                                            updateItem(i, { mrp: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={it.sellingPrice}
                                                        onChange={(e) =>
                                                            updateItem(i, { sellingPrice: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step="0.01"
                                                        value={it.discountPercent}
                                                        onChange={(e) =>
                                                            updateItem(i, { discountPercent: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        value={it.hsnCode}
                                                        onChange={(e) =>
                                                            updateItem(i, { hsnCode: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="number"
                                                        min={0}
                                                        max={28}
                                                        step="0.01"
                                                        value={it.gstPercentage}
                                                        onChange={(e) =>
                                                            updateItem(i, { gstPercentage: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <AppSelect
                                                        value={String(it.location ?? "")}
                                                        placeholder="Rack"
                                                        options={[
                                                            { label: "—", value: "" },
                                                            ...locations.map((loc) => ({
                                                                label: loc.code ? `${loc.name} (${loc.code})` : loc.name,
                                                                value: String(loc.id),
                                                            })),
                                                        ]}
                                                        onChange={(value) => updateItem(i, { location: value })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="date"
                                                        value={it.manufactureDate}
                                                        onChange={(e) =>
                                                            updateItem(i, { manufactureDate: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <input
                                                        className='w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none'
                                                        type="date"
                                                        value={it.expiryDate}
                                                        onChange={(e) =>
                                                            updateItem(i, { expiryDate: e.target.value })
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell className="">
                                                    ₹{c.totalAmount.toFixed(2)}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={!it.productId}
                                                            onClick={() => duplicateItem(i)}
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </Button>

                                                        {items.length > 1 && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => removeItem(i)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-[var(--text-critical)]" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-5 border-t border-slate-200 py-3 text-xs">
                        <span className="text-slate-500">Subtotal <span className="font-medium text-slate-700">₹{totals.subtotal.toFixed(2)}</span></span>
                        {isInterState ? (
                            <span className="text-slate-500">IGST <span className="font-medium text-slate-700">₹{totals.totalIgst.toFixed(2)}</span></span>
                        )
                            :
                            (
                                <>
                                    <span className="text-slate-500">CGST <span className="font-medium text-slate-700">₹{totals.totalCgst.toFixed(2)}</span></span>
                                    <span className="text-slate-500">SGST <span className="font-medium text-slate-700">₹{totals.totalSgst.toFixed(2)}</span></span>
                                </>
                            )}
                        <span className="text-sm font-semibold text-slate-900">Total ₹{totals.totalAmount.toFixed(2)}</span>
                        <Button
                            variant={'success'}
                            disabled={saving}
                            onClick={handleSubmit}

                        >
                            {saving ? 'Submitting…' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </Container>
        </div >
    );
}