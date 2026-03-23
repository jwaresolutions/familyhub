'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useAdmin';
import type { User } from '@organize/shared';

const COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Orange' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const FRONTEND_VERSION = '1.0.0';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', color: '#3B82F6', role: 'member' });
  const [editData, setEditData] = useState({ name: '', color: '', role: '', password: '' });
  const [error, setError] = useState('');
  const [apiVersion, setApiVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/version`)
      .then(r => r.json())
      .then(d => setApiVersion(d.version))
      .catch(() => setApiVersion('unknown'));
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [isLoading, user, router]);

  if (isLoading || loadingUsers) return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  if (!user || user.role !== 'admin') return null;

  async function handleCreate() {
    setError('');
    if (!formData.username || !formData.password || !formData.name) {
      setError('All fields are required');
      return;
    }
    try {
      await createUser.mutateAsync(formData);
      setShowCreate(false);
      setFormData({ username: '', password: '', name: '', color: '#3B82F6', role: 'member' });
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  }

  function startEdit(u: User) {
    setEditingUser(u);
    setEditData({ name: u.name, color: u.color, role: u.role, password: '' });
    setError('');
  }

  async function handleUpdate() {
    if (!editingUser) return;
    setError('');
    try {
      const data: any = { id: editingUser.id };
      if (editData.name !== editingUser.name) data.name = editData.name;
      if (editData.color !== editingUser.color) data.color = editData.color;
      if (editData.role !== editingUser.role) data.role = editData.role;
      if (editData.password) data.password = editData.password;
      await updateUser.mutateAsync(data);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  }

  async function handleDelete(u: User) {
    if (u.id === user!.id) return;
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await deleteUser.mutateAsync(u.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <Button onClick={() => setShowCreate(true)}>+ Add User</Button>
      </div>

      <div className="grid gap-4">
        {users.map(u => (
          <Card key={u.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} color={u.color} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{u.name}</span>
                  <Badge label={u.role} color={u.role === 'admin' ? '#3B82F6' : '#6B7280'} />
                </div>
                <p className="text-sm text-gray-500">@{u.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => startEdit(u)}>Edit</Button>
              {u.id !== user!.id && (
                <Button variant="danger" size="sm" onClick={() => handleDelete(u)}>Delete</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add User">
        <div className="space-y-3">
          <Input label="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
          <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <Select label="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} options={COLORS} />
          <Select label="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} options={[{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }]} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Create</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit ${editingUser?.name || ''}`}>
        <div className="space-y-3">
          <Input label="Name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
          <Select label="Color" value={editData.color} onChange={e => setEditData({ ...editData, color: e.target.value })} options={COLORS} />
          <Select label="Role" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} options={[{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }]} />
          <Input label="New Password (leave blank to keep current)" type="password" value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleUpdate}>Save</Button>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <p className="text-xs text-gray-400 text-center pt-4">
        API v{apiVersion ?? '...'} | Frontend v{FRONTEND_VERSION}
      </p>
    </div>
  );
}
