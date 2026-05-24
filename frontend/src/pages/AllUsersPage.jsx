import React, { useState } from 'react';
import { useGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../features/users/usersApi';
import toast from 'react-hot-toast';

const ROLES = ['employee', 'manager', 'admin'];

const AllUsersPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', isActive: true });

  const { data, isLoading, refetch } = useGetAllUsersQuery({ search, role: roleFilter, page, limit: 15 });
  const users = data?.users || [];
  const total = data?.total || 0;

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'employee', department: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', isActive: u.isActive });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const payload = { name: form.name, role: form.role, department: form.department, isActive: form.isActive };
        await updateUser({ id: editUser._id, ...payload }).unwrap();
        toast.success('User updated!');
      } else {
        await createUser(form).unwrap();
        toast.success('User created!');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Operation failed.');
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success('User deactivated.');
      refetch();
    } catch (err) {
      toast.error('Failed to deactivate.');
    }
  };

  const getRoleBadge = (role) => ({ admin: 'badge-purple', manager: 'badge-blue', employee: 'badge-success' }[role] || 'badge-muted');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all system users, roles, and departments</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card stat-purple">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{total}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon">🛡</div>
          <div className="stat-info">
            <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon">👔</div>
          <div className="stat-info">
            <div className="stat-number">{users.filter(u => u.role === 'manager').length}</div>
            <div className="stat-label">Managers</div>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <div className="stat-number">{users.filter(u => u.role === 'employee').length}</div>
            <div className="stat-label">Employees</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <input type="text" className="form-input" placeholder="🔍 Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-input" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="table-loading"><span className="spinner-lg"></span></div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className={!u.isActive ? 'row-inactive' : ''}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{u.name?.charAt(0)}</div>
                      <div>
                        <div className="user-name">{u.name}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                  <td>{u.department || '—'}</td>
                  <td>{u.managerId?.name || '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-xs btn-outline" onClick={() => openEdit(u)}>✏ Edit</button>
                      {u.isActive && (
                        <button className="btn btn-xs btn-danger" onClick={() => handleDeactivate(u._id, u.name)}>Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page} of {Math.ceil(total / 15)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>{editUser ? '✏ Edit User' : '+ Create User'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editUser} />
                </div>
              </div>
              {!editUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" className="form-input" placeholder="e.g. Engineering" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              {editUser && (
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating || updating}>
                  {(creating || updating) ? <span className="spinner"></span> : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsersPage;
