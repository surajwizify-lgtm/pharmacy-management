import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, conflict } from '@/lib/api-utils';
import { createUserSchema } from '@/lib/schemas';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const USER_SELECT = {
  id: true, username: true, pharmacy: {
    select: {
      id: true,
      name: true,
    },
  }, fullName: true, role: true, active: true, createdAt: true
};


export async function GET() {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.SUPER_ADMIN]);
    const session = await getServerSession(authOptions);
    return session?.user.role == Role.SUPER_ADMIN ? prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'desc' } }) : prisma.user.findMany({ where: { pharmacyId: session?.user.pharmacyId }, select: USER_SELECT, orderBy: { createdAt: 'desc' } });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.SUPER_ADMIN]);
    const dto = createUserSchema.parse(await req.json());


    const existing = await prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw conflict(`Username "${dto.username}" already exists`);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return prisma.user.create({
      data: { username: dto.username, passwordHash, fullName: dto.fullName, role: dto.role, pharmacyId: Number(dto.pharmacyId) },
      select: USER_SELECT,
    });
  });
}
