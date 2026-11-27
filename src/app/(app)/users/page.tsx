

import type { AppUser } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { prisma } from '@/lib/prisma';
import UserTable from './UserTable';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import AddUserButton from './AddUserButton';



export default async function UsersPage() {

  const session = await getServerSession(authOptions);

  const u = session?.user.role == Role.ADMIN ? await prisma.user.findMany({ where: { pharmacyId: session?.user.pharmacyId }, include: { pharmacy: true } }) : await prisma.user.findMany({ include: { pharmacy: true } });

  const users: AppUser[] = u.map((user) => {
    return ({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, pharmacy: { id: user.pharmacy?.id || 0, name: user.pharmacy?.name || "", gstin: user.pharmacy?.gstin || '', phone: user.pharmacy?.phone || '', address: user.pharmacy?.address || '' }, createdAt: user.updatedAt, active: user.active })
  })



  return (
    <div className="">
      <PageHeader
        header={`Users`}
        subheader="Admin, pharmacist, and cashier accounts."
      >
        <AddUserButton />
      </PageHeader>

      <Container>
        {/* <div className="card overflow-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {(
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.username}</TableCell>

                    <TableCell>{u.fullName}</TableCell>

                    <TableCell>{u.role}</TableCell>

                    <TableCell>
                      <span>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell>{u.pharmacy?.name}</TableCell>

                    <TableCell>
                      {u.active && (
                        <Button
                          variant="link"
                        // onClick={() => deactivate(u.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div> */}
        <UserTable data={users} />
      </Container >


    </div >
  );
}
