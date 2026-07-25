'use client'
import React from 'react'
import { Card, CardContent } from '../ui/card'
import { useRouter } from 'next/navigation'
import { Button, ButtonVarients } from '../ui/button';


export default function DashboardLinks() {
    const router = useRouter();
    const links: { title: string, link: string, varient: ButtonVarients }[] = [
        {
            title: "+ Customer Bill",
            link: "/billing/all-sales/new",
            varient: "outline"
        },
        {
            title: "+ Purchase Order",
            link: "/purchase-orders/new",
            varient: "outline"
        },
        {
            title: "+ Supplier",
            link: "/purchase-orders/suppliers/new",
            varient: "outline"
        },
        {
            title: "View P.O.",
            link: "/purchase-orders/registered",
            varient: "secondary"
        },
        {
            title: "Customer Bills",
            link: "/billing/all-sales",
            varient: "secondary"
        },
        {
            title: "View/Add Racks",
            link: "/batches/locations",
            varient: "secondary"
        },
    ]
    return (
        <Card >
            <CardContent className='grid lg:grid-cols-6 grid-cols-3 gap-2'>
                {
                    links.map((l) => {
                        return <Button variant={l.varient || null} onClick={() => router.push(l.link)}>
                            {l.title}
                        </Button>
                    })
                }
            </CardContent>
        </Card>
    )
}
