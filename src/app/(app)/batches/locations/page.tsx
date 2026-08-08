// app/locations/page.tsx
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/common/Header';
import Container from '@/components/common/Container';
import LocationsTable from './LocationsTable';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function LocationsPage() {
    const session = await getServerSession(authOptions);
    const locs = await prisma.location.findMany({
        where: { pharmacyId: session?.user.pharmacyId || 0 },
        include: { _count: { select: { batches: true } } },
        orderBy: { name: 'asc' },
    });

    const locations: any[] = locs.map((l) => ({
        id: l.id,
        name: l.name,
        code: l.code,
        type: l.type,
        description: l.description,
        active: l.active,
        _count: { batches: l._count.batches },
    }));

    return (
        <div className="">
            <PageHeader header="Locations" subheader="Add rack, shelves, coldstorage" />

            <Container>
                <LocationsTable data={locations} />
            </Container>
        </div>
    );
}