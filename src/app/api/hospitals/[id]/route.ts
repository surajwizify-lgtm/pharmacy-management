import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// If your Next.js version is 15+, `params` is a Promise — change the
// signatures below to: { params }: { params: Promise<{ id: string }> }
// and do `const { id } = await params;` inside each handler.

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) {
    return NextResponse.json({ message: 'Hospital not found.' }, { status: 404 });
  }
  return NextResponse.json(hospital);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json().catch(() => null);

  if (!body?.name?.trim()) {
    return NextResponse.json({ message: 'Hospital name is required.' }, { status: 400 });
  }

  try {
    const hospital = await prisma.hospital.update({
      where: { id },
      data: {
        name: body.name.trim(),
        address: body.address?.trim() || null,
        phone: body.phone?.trim() || null,
        gstin: body.gstin?.trim().toUpperCase() || null,
      },
    });
    return NextResponse.json(hospital);
  } catch (err) {
    console.error('Failed to update hospital:', err);
    return NextResponse.json({ message: 'Could not update hospital.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  try {
    await prisma.hospital.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete hospital:', err);
    return NextResponse.json(
      { message: 'Could not delete hospital. It may be linked to existing bills.' },
      { status: 409 },
    );
  }
}