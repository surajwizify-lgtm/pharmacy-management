import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/purchase-orders/manufacturer/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const manufacturer = await prisma.manufacturer.findUnique({ where: { id } });
    if (!manufacturer) {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
    }
    return NextResponse.json({ data: manufacturer });
  } catch (err) {
    console.error(`GET /api/purchase-orders/manufacturer/${params.id} failed`, err);
    return NextResponse.json({ error: "Failed to fetch manufacturer" }, { status: 500 });
  }
}

// PUT /api/purchase-orders/manufacturer/:id
// Body: any subset of { name, contactPerson, phone, email, address, gstin, drugLicenseNo, status }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await req.json();

    if (body.name !== undefined && !String(body.name).trim()) {
      return NextResponse.json({ error: "'name' cannot be empty" }, { status: 400 });
    }
    if (body.status !== undefined && body.status !== "ACTIVE" && body.status !== "INACTIVE") {
      return NextResponse.json({ error: "'status' must be ACTIVE or INACTIVE" }, { status: 400 });
    }

    const manufacturer = await prisma.manufacturer.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.contactPerson !== undefined ? { contactPerson: body.contactPerson || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.address !== undefined ? { address: body.address || null } : {}),
        ...(body.gstin !== undefined ? { gstin: body.gstin || null } : {}),
        ...(body.drugLicenseNo !== undefined ? { drugLicenseNo: body.drugLicenseNo || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });

    return NextResponse.json({ data: manufacturer });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
    }
    console.error(`PUT /api/purchase-orders/manufacturer/${params.id} failed`, err);
    return NextResponse.json({ error: "Failed to update manufacturer" }, { status: 500 });
  }
}

// DELETE /api/purchase-orders/manufacturer/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await prisma.manufacturer.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
    }
    // P2003: FK constraint - manufacturer is referenced by products
    if (err?.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete: this manufacturer is linked to existing products" },
        { status: 409 }
      );
    }
    console.error(`DELETE /api/purchase-orders/manufacturer/${params.id} failed`, err);
    return NextResponse.json({ error: "Failed to delete manufacturer" }, { status: 500 });
  }
}
