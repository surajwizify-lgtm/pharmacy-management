import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, badRequest } from '@/lib/api-utils';

// PATCH /api/users/:id/deactivate - ADMIN only
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid user id');
    return prisma.user.update({ where: { id }, data: { active: false } });
  });
}
