

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ItemRow, Product, Supplier, Location } from '@/types/purchaseOrder/perchaseOrderType';
import { EMPTY_ITEM } from '@/constants/constants';
import { calcLine, num } from '../../utils/funtions';
import { product } from '@/types';
import { toast } from 'sonner';
export function usePurchaseForm() {
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [poNumber, setPoNumber] = useState('');
    const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [grnNumber, setGrnNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [isInterState, setIsInterState] = useState(false);

    const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);

    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<product[]>([]);



    function updateItem(index: number, patch: Partial<ItemRow>) {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    }

    function onProductChange(index: number, productId: number) {
        const p = products.find((p) => p.id === productId);
        updateItem(index, {
            productId,
            hsnCode: p?.hsnCode ?? '',
            name: p?.name ?? '',
            gstPercentage: p ? String(p.gstPercentage) : '',
        });
    }

    function addItem() {
        setItems((prev) => {
            if (prev[0].name) {

                return [{ ...EMPTY_ITEM }, ...prev,]
            }
            return prev
        })
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function duplicateItem(index: number) {
        setItems((prev) => {
            const source = prev[index];
            const clone: ItemRow = {
                ...source,
                batchNumber: '',
                manufactureDate: '',
                expiryDate: '',
                quantity: '',
                freeQuantity: '0',
            };
            const next = [...prev];
            next.splice(index + 1, 0, clone);
            return next;
        });
    }

    const lineCalcs = useMemo(() => items.map((it) => calcLine(it, isInterState)), [items, isInterState]);

    const totals = useMemo(() => {
        return lineCalcs.reduce(
            (acc, c) => ({
                subtotal: acc.subtotal + c.taxableValue,
                totalCgst: acc.totalCgst + c.cgstAmount,
                totalSgst: acc.totalSgst + c.sgstAmount,
                totalIgst: acc.totalIgst + c.igstAmount,
                totalGst: acc.totalGst + c.gstAmount,
                totalAmount: acc.totalAmount + c.totalAmount,
            }),
            { subtotal: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalGst: 0, totalAmount: 0 }
        );
    }, [lineCalcs]);

    async function handleSubmit() {
        // e.preventDefault();
        setError(null);

        if (!supplierId) {
            return setError('Select a supplier');


        }
        if (!invoiceNumber || !grnNumber) {
            return setError('invoice number, and GRN number are required');
        }
        console.log('hele')
        if (items.length === 0 || items.some((it) => !it.productId)) return setError('Every line needs a product');

        setSaving(true);
        try {
            const payload = {
                supplierId,
                // poNumber,
                // orderDate,
                // expectedDate: expectedDate || undefined,
                notes: notes || undefined,

                invoiceNumber,
                grnNumber,
                invoiceDate,
                isInterState,

                subtotal: totals.subtotal,
                totalCgst: totals.totalCgst,
                totalSgst: totals.totalSgst,
                totalIgst: totals.totalIgst,
                totalGst: totals.totalGst,
                totalAmount: totals.totalAmount,

                items: items.map((it, i) => ({
                    productId: it.productId,
                    batchNumber: it.batchNumber,
                    manufactureDate: it.manufactureDate || undefined,
                    expiryDate: it.expiryDate,
                    quantity: num(it.quantity),
                    freeQuantity: num(it.freeQuantity),
                    purchaseRate: num(it.purchaseRate),
                    mrp: num(it.mrp),
                    sellingPrice: num(it.sellingPrice),
                    discountPercent: num(it.discountPercent),
                    hsnCode: it.hsnCode,
                    gstPercentage: num(it.gstPercentage),
                    cgstAmount: lineCalcs[i].cgstAmount,
                    sgstAmount: lineCalcs[i].sgstAmount,
                    igstAmount: lineCalcs[i].igstAmount,
                    taxableValue: lineCalcs[i].taxableValue,
                    totalAmount: lineCalcs[i].totalAmount,
                    location: it.location || undefined,
                })),
            };

            await apiFetch('/api/purchase-invoices/withpo', { method: 'POST', body: JSON.stringify(payload) });
            router.push('/purchase-orders/purchase-invoices');
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }
    useEffect(() => {
        if (!search) {
            setResults([]);
            return;
        }
        const t = setTimeout(async () => {
            const data = await apiFetch<product[]>(`/api/products?search=${encodeURIComponent(search)}&status=ACTIVE`);
            setResults(data);
        }, 250);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => {
        apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => { });
        apiFetch<Product[]>('/api/products').then(setProducts).catch(() => { });
        apiFetch<Location[]>('/api/locations').then(setLocations).catch(() => { });
    }, []);
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error])
    return {
        locations,
        suppliers,
        products,
        supplierId, setSupplierId,
        poNumber, setPoNumber,
        orderDate, setOrderDate,
        expectedDate, setExpectedDate,
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
        search,
        setSearch,
        results, setResults,
    }
}