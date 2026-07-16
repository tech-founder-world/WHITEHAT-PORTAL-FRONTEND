import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/ManageStudents.css';

const emptyForm = { name: '', rollNumber: '', email: '', subjects: [] };

export default function ManageStudents() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // subjects for filter chips & form quick-select
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [loading, setLoading] = useState(true);

  // Admin-only modal state
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

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admin: fetch all students + all subjects from teachers
        const [stuRes, teacherRes] = await Promise.all([
          api.get('/students'),
          api.get('/admin/teachers'),
        ]);
        setStudents(stuRes.data);
        const subjectSet = new Set();
        teacherRes.data.forEach(t => t.subjects.forEach(s => subjectSet.add(s)));
        setAllSubjects([...subjectSet].sort());
      } else {
        // Teacher: only see students enrolled in their own subjects
        const teacherSubjects = user?.subjects || [];
        setAllSubjects(teacherSubjects);

        if (teacherSubjects.length === 0) {
          setStudents([]);
        } else {
          // Fetch students per subject and deduplicate
          const results = await Promise.all(
            teacherSubjects.map(sub => api.get(`/students?subject=${encodeURIComponent(sub)}`))
          );
          const seen = new Set();
          const combined = [];
          results.forEach(r => {
            r.data.forEach(s => {
              if (!seen.has(s._id)) { seen.add(s._id); combined.push(s); }
            });
          });
          combined.sort((a, b) => a.name.localeCompare(b.name));
          setStudents(combined);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Filter locally by search + subject chip
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(students.filter(s =>
      (!filterSubject || (s.subjects || []).includes(filterSubject)) &&
      (!q || s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.subjects || []).some(sub => sub.toLowerCase().includes(q)))
    ));
  }, [search, filterSubject, students]);

  // ── Admin modal helpers ──────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm);
    setSubjectInput('');
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setForm({ name: s.name, rollNumber: s.rollNumber, email: s.email || '', subjects: s.subjects || [] });
    setSubjectInput('');
    setEditId(s._id);
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

  const addCustomSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (!form.subjects.includes(trimmed))
      setForm(prev => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
    setSubjectInput('');
  };

  const removeSubjectTag = (sub) =>
    setForm(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== sub) }));

  const handleSave = async () => {
    if (!form.name || !form.rollNumber) return showToast('Name and roll number required', 'error');
    setSaving(true);
    try {
      const payload = { name: form.name, rollNumber: form.rollNumber, email: form.email, subjects: form.subjects };
      if (editId) {
        await api.put(`/students/${editId}`, payload);
        showToast('Student updated');
      } else {
        await api.post('/students', payload);
        showToast('Student added');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving student', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"? Their attendance and evaluation records will also be deleted.`)) return;
    try {
      await api.delete(`/students/${id}`);
      showToast('Student removed');
      fetchAll();
    } catch { showToast('Error removing student', 'error'); }
  };

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {isAdmin
              ? `${students.length} student${students.length !== 1 ? 's' : ''} in the system`
              : `Students enrolled in your subject${(user?.subjects || []).length !== 1 ? 's' : ''}: ${(user?.subjects || []).join(', ')}`}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>
        )}
      </div>

      <div className="card">
        {/* Filters */}
        <div className="filters-row" style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-control"
            placeholder="Search by name, roll no, or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '280px' }}
          />
          {allSubjects.length > 1 && (
            <select
              className="form-control"
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="">All Subjects</option>
              {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {(search || filterSubject) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setFilterSubject(''); }}>Clear</button>
          )}
          <span className="text-muted" style={{ fontSize: '13px' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <p>
              {search || filterSubject
                ? 'No students match your filters.'
                : isAdmin
                  ? 'No students yet. Add your first student.'
                  : 'No students enrolled in your subjects yet.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Name</th>
                  <th>Enrolled Subjects</th>
                  <th>Email</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td><span className="roll-badge">{s.rollNumber}</span></td>
                    <td><strong>{s.name}</strong></td>
                    <td>
                      <div className="subject-tags-inline">
                        {(s.subjects || []).length > 0
                          ? (s.subjects || []).map(sub => (
                              <span
                                key={sub}
                                className="subject-tag"
                                style={{
                                  // Highlight subjects that belong to this teacher
                                  opacity: !isAdmin && !(user?.subjects || []).includes(sub) ? 0.45 : 1,
                                }}
                              >
                                {sub}
                              </span>
                            ))
                          : <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td className="text-muted">{s.email || '—'}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id, s.name)}>Remove</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin-only Add/Edit Modal */}
      {isAdmin && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Student' : 'Add Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="e.g. Rahul Verma"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input className="form-control" placeholder="e.g. CS2024001"
                value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="form-control" type="email" placeholder="student@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Enrolled Subjects</label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Click to toggle — these control which teacher's attendance and evaluations this student appears in
              </p>

              {allSubjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {allSubjects.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      style={{
                        padding: '5px 12px', borderRadius: '20px', border: '1.5px solid',
                        borderColor: form.subjects.includes(sub) ? 'var(--primary)' : 'var(--border)',
                        background: form.subjects.includes(sub) ? 'var(--primary)' : 'transparent',
                        color: form.subjects.includes(sub) ? '#fff' : 'var(--text)',
                        cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s',
                      }}
                    >
                      {form.subjects.includes(sub) ? '✓ ' : ''}{sub}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-control"
                  placeholder="Type a custom subject name..."
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubject())}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-outline btn-sm" type="button" onClick={addCustomSubject}>Add</button>
              </div>

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
                      <button onClick={() => removeSubjectTag(sub)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '15px' }}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
