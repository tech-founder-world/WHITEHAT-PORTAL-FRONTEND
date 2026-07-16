import { useState, useEffect } from 'react';
import api from '../api';
import '../css/ManageTeachers.css';

const emptyForm = { name: '', email: '', password: '', subjects: [] };

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [subjectInput, setSubjectInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/admin/teachers');
      setTeachers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, []);

  // Collect all subjects already used across teachers (for quick-select)
  const knownSubjects = [...new Set(teachers.flatMap(t => t.subjects))].sort();

  const openAdd = () => {
    setForm(emptyForm);
    setSubjectInput('');
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({ name: t.name, email: t.email, password: '', subjects: t.subjects || [] });
    setSubjectInput('');
    setEditId(t._id);
    setShowModal(true);
  };

  const toggleSubject = (sub) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter(s => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (!form.subjects.includes(trimmed)) {
      setForm(prev => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
    }
    setSubjectInput('');
  };

  const removeSubject = (sub) => {
    setForm(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== sub) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return showToast('Name and email required', 'error');
    if (!editId && !form.password) return showToast('Password required for new teacher', 'error');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        subjects: form.subjects,
        ...(form.password && { password: form.password }),
      };
      if (editId) {
        await api.put(`/admin/teachers/${editId}`, payload);
        showToast('Teacher updated successfully');
      } else {
        await api.post('/admin/teachers', { ...payload, password: form.password });
        showToast('Teacher created successfully');
      }
      setShowModal(false);
      fetchTeachers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving teacher', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      showToast('Teacher deleted');
      fetchTeachers();
    } catch (err) {
      showToast('Error deleting teacher', 'error');
    }
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">Manage teacher accounts and their assigned subjects</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /><p>Loading...</p></div>
        ) : teachers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👩‍🏫</div>
            <p>No teachers yet. Add your first teacher to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subjects (Tags)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, i) => (
                  <tr key={t._id}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <div className="teacher-name-cell">
                        <div className="teacher-avatar">{t.name[0].toUpperCase()}</div>
                        <strong>{t.name}</strong>
                      </div>
                    </td>
                    <td className="text-muted">{t.email}</td>
                    <td>
                      <div className="subject-tags-inline">
                        {t.subjects.length > 0
                          ? t.subjects.map(s => <span key={s} className="subject-tag">{s}</span>)
                          : <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id, t.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="e.g. Priya Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="teacher@school.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{editId ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input className="form-control" type="password" placeholder={editId ? 'Leave blank to keep' : 'Set password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {/* Subject Tags */}
            <div className="form-group">
              <label className="form-label">Assigned Subjects</label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                These become the subject tags. Only students enrolled in the same subject will appear when this teacher marks attendance.
              </p>

              {/* Quick-select from existing subjects */}
              {knownSubjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {knownSubjects.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: '1.5px solid',
                        borderColor: form.subjects.includes(sub) ? 'var(--primary)' : 'var(--border)',
                        background: form.subjects.includes(sub) ? 'var(--primary)' : 'transparent',
                        color: form.subjects.includes(sub) ? '#fff' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {form.subjects.includes(sub) ? '✓ ' : ''}{sub}
                    </button>
                  ))}
                </div>
              )}

              {/* New subject input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-control"
                  placeholder="New subject name..."
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-outline btn-sm" type="button" onClick={addSubject}>Add</button>
              </div>

              {/* Selected subject tags */}
              {form.subjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {form.subjects.map(sub => (
                    <span key={sub} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 10px', borderRadius: '20px',
                      background: 'var(--primary-light, #e8f0fe)', color: 'var(--primary)',
                      fontSize: '13px', fontWeight: 500,
                    }}>
                      {sub}
                      <button
                        onClick={() => removeSubject(sub)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0', lineHeight: 1, fontSize: '14px' }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
