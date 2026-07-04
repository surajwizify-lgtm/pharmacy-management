import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// If your Next.js version is 15+, `params` is a Promise — change the
// signatures below to: { params }: { params: Promise<{ id: string }> }
// and do `const { id } = await params;` inside each handler.

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) {
    return NextResponse.json({ message: 'Doctor not found.' }, { status: 404 });
  }
  return NextResponse.json(doctor);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json().catch(() => null);

  if (!body?.name?.trim()) {
    return NextResponse.json({ message: 'Doctor name is required.' }, { status: 400 });
  }

  try {
    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name: body.name.trim(),
        registrationNo: body.registrationNo?.trim() || null,
        specialization: body.specialization?.trim() || null,
        phone: body.phone?.trim() || null,
      },
    });
    return NextResponse.json(doctor);
  } catch (err) {
    console.error('Failed to update doctor:', err);
    return NextResponse.json({ message: 'Could not update doctor.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  try {
    await prisma.doctor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete doctor:', err);
    // Likely a foreign-key constraint (doctor is linked to existing bills)
    return NextResponse.json(
      { message: 'Could not delete doctor. It may be linked to existing bills.' },
      { status: 409 },
    );
  }
}