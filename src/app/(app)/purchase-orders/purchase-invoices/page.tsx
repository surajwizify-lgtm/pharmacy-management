
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import PurchaseInvoicesTable from '@/components/purchase-orders/purchase-invoices/PurchaseInvoiceTable';


export default async function PurchaseInvoicesPage() {
    const data = await apiFetch<any[]>('http://localhost:3000/api/purchase-invoices');
    const supplier = await apiFetch('http://localhost:3000/api/suppliers');

    return (
        <div className="">
            <PageHeader
                header={`Purchase Invoices`}
                subheader="View All Purchase Invoices"
            >
                <HeaderButton text="Create Invoice" href='/purchase-orders/purchase-invoices/new' />
            </PageHeader>
            <PurchaseInvoicesTable suppliers={supplier} invoices={data} />
        </div>
    );
}