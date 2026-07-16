import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const poId = Number(params.id);

        const purchaseOrder = await prisma.purchaseOrder.findUnique({
            where: {
                id: poId,
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!purchaseOrder) {
            return NextResponse.json(
                { error: "Purchase Order not found" },
                { status: 404 }
            );
        }

        if (!purchaseOrder.supplier.email) {
            return NextResponse.json(
                { error: "Supplier email not found" },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const rows = purchaseOrder.items
            .map(
                (item) => `
          <tr>
            <td>${item.product.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.expectedRate}</td>
            <td>₹${item.quantity * Number(item.expectedRate)}</td>
          </tr>
        `
            )
            .join("");

        const total = purchaseOrder.items.reduce(
            (sum, item) => sum + item.quantity * Number(item.expectedRate),
            0
        );

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: purchaseOrder.supplier.email,
            subject: `Purchase Order #${purchaseOrder.id}`,
            html: `
        <h2>Purchase Order #${purchaseOrder.id}</h2>

        <p>Dear ${purchaseOrder.supplier.name},</p>

        <p>
        Please supply the following items.
        </p>

        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>

          ${rows}

          <tr>
            <td colspan="3"><strong>Grand Total</strong></td>
            <td><strong>₹${total}</strong></td>
          </tr>
        </table>

        <br/>

        <p>Regards,</p>

        <p><strong>ABC Pharmacy</strong></p>
      `,
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Unable to send email",
            },
            {
                status: 500,
            }
        );
    }
}