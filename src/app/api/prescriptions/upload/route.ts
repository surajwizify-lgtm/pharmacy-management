import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { requireSession, withErrorHandling } from '@/lib/api-utils';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'prescriptions');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(req: NextRequest) {
    return withErrorHandling(async () => {
        await requireSession();

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ message: 'No file provided' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ message: 'Unsupported file type' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ message: 'File too large (max 5MB)' }, { status: 400 });
        }

        await mkdir(UPLOAD_DIR, { recursive: true });

        const ext = path.extname(file.name);
        const storedName = `${randomUUID()}${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

        return NextResponse.json({
            prescriptionFile: `/uploads/prescriptions/${storedName}`,
            prescriptionName: file.name,
            prescriptionType: file.type,
        });
    });
}