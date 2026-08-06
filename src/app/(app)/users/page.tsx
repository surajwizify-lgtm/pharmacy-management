'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { AppUser, Role } from '@/types';
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
import { Pharmacy } from '@prisma/client';
import { CloudCog } from 'lucide-react';
import { number } from 'zod';
import { useSession } from 'next-auth/react';

const EMPTY_FORM = { username: '', password: '', fullName: '', role: 'CASHIER' as Role, pharmacyId: '' };

export default function UsersPage() {
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pharmacyId, setPharmacyId] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  async function load() {
    setLoading(true);
    try {
      setUsers(await apiFetch<AppUser[]>('/api/users'));
      setPharmacies(await apiFetch<Pharmacy[]>('/api/pharmacies'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (session?.user.role == 'ADMIN') {
      setForm({ ...form, pharmacyId: String(session.user.pharmacyId) })
    }
  }, []);


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }
  console.log(form);
  async function deactivate(id: number) {
    if (!confirm('Deactivate this user?')) return;
    await apiFetch(`/api/users/${id}/deactivate`, { method: 'PATCH' });
    load();
  }
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div className="">
      <PageHeader
        header={`Users`}
        subheader="Admin, pharmacist, and cashier accounts."
      >
        <HeaderButton text=" Add user" onClick={() => setShowForm(true)} />
      </PageHeader>

      <Container>
        <div className="card overflow-hidden">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
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
                          onClick={() => deactivate(u.id)}
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
        </div>
      </Container >

      {showForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <Card className=" bg-bg-primary w-full max-w-xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Add user</h2>


            <form onSubmit={handleSubmit} className="space-y-3">
              {session?.user.role != 'ADMIN' && <div className="space-y-1.5">

                <Select
                  value={form.pharmacyId}
                  onValueChange={(value) => setForm({ ...form, pharmacyId: String(value) })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a Pharmacy" />
                  </SelectTrigger>

                  <SelectContent>
                    {pharmacies.map((p) => (
                      <SelectItem label={p.name} key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>}
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password (min. 8 chars)</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value as Role })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
            {/* <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Username</label>
                <input className="input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="label">Password (min. 8 chars)</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Full name</label>
                <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  <option value="ADMIN">Admin</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="CASHIER">Cashier</option>
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form> */}
          </Card>
        </div>
      )
      }
    </div >
  );
}
