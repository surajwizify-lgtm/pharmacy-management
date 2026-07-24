'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { product } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import DetailPageHeader from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Container from '@/components/common/Container';

const EMPTY_BATCH = { batchNumber: '', expiryDate: '', purchasePrice: '', sellingPrice: '', quantityAvailable: '' };

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

export default function productDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const canEdit = role === 'ADMIN' || role === 'PHARMACIST';

  const [product, setproduct] = useState<product | null>(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [location, setLocation] = useState('');

  async function load() {
    const data = await apiFetch<product>(`/api/products/${params.id}`);
    setproduct(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleAddBatch(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/batches', {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(params.id),
          batchNumber: batchForm.batchNumber,
          expiryDate: batchForm.expiryDate,
          purchasePrice: Number(batchForm.purchasePrice),
          sellingPrice: Number(batchForm.sellingPrice),
          quantityAvailable: Number(batchForm.quantityAvailable),
          location: location || undefined,
        }),
      });
      setShowBatchForm(false);
      setBatchForm(EMPTY_BATCH);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function adjustStock(batchId: number, version: number, delta: number) {
    setAdjusting(batchId);
    try {
      await apiFetch(`/api/batches/${batchId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantityDelta: delta, version }),
      });
      load();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setAdjusting(null);
    }
  }

  if (!product) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
        Loading…
      </div>
    );
  }

  const totalStock = product.batches.reduce((s, b) => s + b.quantityAvailable, 0);

  return (
    <div>

      <DetailPageHeader
        backHref="/products"
        backLabel="Back to products"
        title={product.name}
        subtitle={
          <>
            {cn(product.manufacturer, ",", "HSN: ", product.hsnCode, ", GST:", product.gstPercentage)}
          </>
        }
        status={{
          label: 'status',
          active: true,
        }}
        actions={
          false && (
            <Button
              variant={'success'}
            // onClick={handlePrint}
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
            <p className="mb-1 text-xs font-medium text-neutral-500">Total stock</p>
            <p className="text-xl font-semibold text-neutral-900">{totalStock}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium text-neutral-500">Batches</p>
            <p className="text-xl font-semibold text-neutral-900">{product.batches.length}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-medium text-neutral-500">Prescription</p>
            <p className="text-xl font-semibold text-neutral-900">{product.prescriptionRequired ? 'Required' : 'Not required'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-neutral-800">Batches (FIFO by expiry)</h2>
            {/* {canEdit && (
              <button
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                onClick={() => setShowBatchForm(true)}
              >
                + Add batch
              </button>
            )} */}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Qty Available</TableHead>
                {canEdit && <TableHead className="text-center">Adjust</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {product.batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    {b.batchNumber}
                  </TableCell>

                  <TableCell>
                    {new Date(b.expiryDate).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    {b.location || "-"}
                  </TableCell>

                  <TableCell>
                    ₹{b.purchasePrice}
                  </TableCell>

                  <TableCell>
                    ₹{b.sellingPrice}
                  </TableCell>

                  <TableCell>
                    {b.quantityAvailable}
                  </TableCell>

                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={adjusting === b.id}
                          onClick={() => adjustStock(b.id, b.version, -1)}
                        >
                          -1
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={adjusting === b.id}
                          onClick={() => adjustStock(b.id, b.version, 1)}
                        >
                          +1
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={adjusting === b.id}
                          onClick={() => {
                            const n = Number(
                              prompt(
                                "Add/remove how many units? (negative to remove)",
                                "0"
                              )
                            );

                            if (!Number.isNaN(n) && n !== 0) {
                              adjustStock(b.id, b.version, n);
                            }
                          }}
                        >
                          Custom
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Container>

      {/* {showBatchForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold text-neutral-800">Add batch</h2>
            <form onSubmit={handleAddBatch} className="space-y-3">
              <div>
                <label className={labelClass}>Batch number</label>
                <input
                  className={inputClass}
                  required
                  value={batchForm.batchNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Expiry date</label>
                <input
                  className={inputClass}
                  type="date"
                  required
                  value={batchForm.expiryDate}
                  onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Purchase price</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.purchasePrice}
                    onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Location (optional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. R3-S2"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Selling price</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.sellingPrice}
                    onChange={(e) => setBatchForm({ ...batchForm, sellingPrice: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Quantity available</label>
                <input
                  className={inputClass}
                  type="number"
                  required
                  value={batchForm.quantityAvailable}
                  onChange={(e) => setBatchForm({ ...batchForm, quantityAvailable: e.target.value })}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
                  <span className="text-sm font-medium text-danger-700">{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  onClick={() => setShowBatchForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
}