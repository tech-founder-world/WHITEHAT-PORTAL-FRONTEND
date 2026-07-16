import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/AttendanceHistory.css';

// ── Student Profile Drawer ─────────────────────────────────────────────────
function StudentProfile({ student, teacherSubjects, isAdmin, onClose }) {
  const [tab, setTab] = useState('attendance');
  const [attendanceBySubject, setAttendanceBySubject] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRecord, setEditRecord] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // For teachers, fetch per-subject so backend enforces subject access control.
        // For admin, a single call with just studentId returns everything.
        let attRecords = [];
        let evalRecords = [];

        if (isAdmin) {
          const [attRes, evalRes] = await Promise.all([
            api.get(`/attendance?studentId=${student._id}`),
            api.get(`/evaluations?studentId=${student._id}`),
          ]);
          attRecords = attRes.data;
          evalRecords = evalRes.data;
        } else {
          // Teacher: fetch one subject at a time so each call is scope-validated on the backend
          const attResults = await Promise.all(
            teacherSubjects.map(sub =>
              api.get(`/attendance?studentId=${student._id}&subject=${encodeURIComponent(sub)}`)
                .then(r => r.data).catch(() => [])
            )
          );
          const evalResults = await Promise.all(
            teacherSubjects.map(sub =>
              api.get(`/evaluations?studentId=${student._id}&subject=${encodeURIComponent(sub)}`)
                .then(r => r.data).catch(() => [])
            )
          );
          attRecords = attResults.flat();
          evalRecords = evalResults.flat();
        }

        // Group attendance by subject, sorted newest first
        const bySubject = {};
        attRecords.forEach(r => {
          if (!bySubject[r.subject]) bySubject[r.subject] = [];
          bySubject[r.subject].push(r);
        });
        Object.keys(bySubject).forEach(sub => {
          bySubject[sub].sort((a, b) => b.date.localeCompare(a.date));
        });
        setAttendanceBySubject(bySubject);
        setEvaluations(evalRecords.sort((a, b) => b.date.localeCompare(a.date)));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [student._id]);

  const handleEditStatus = async (record, newStatus) => {
    try {
      await api.put(`/attendance/${record._id}`, { status: newStatus });
      showToast('Updated');
      // Refresh attendance scoped to teacher subjects
      let attRecords = [];
      if (isAdmin) {
        const r = await api.get(`/attendance?studentId=${student._id}`);
        attRecords = r.data;
      } else {
        const results = await Promise.all(
          teacherSubjects.map(sub =>
            api.get(`/attendance?studentId=${student._id}&subject=${encodeURIComponent(sub)}`)
              .then(r => r.data).catch(() => [])
          )
        );
        attRecords = results.flat();
      }
      const bySubject = {};
      attRecords.forEach(rec => {
        if (!bySubject[rec.subject]) bySubject[rec.subject] = [];
        bySubject[rec.subject].push(rec);
      });
      Object.keys(bySubject).forEach(sub => {
        bySubject[sub].sort((a, b) => b.date.localeCompare(a.date));
      });
      setAttendanceBySubject(bySubject);
    } catch { showToast('Error updating', 'error'); }
    setEditRecord(null);
  };

  // Compute overall stats per subject
  const subjectStats = Object.entries(attendanceBySubject).map(([sub, records]) => {
    const present = records.filter(r => r.status === 'present').length;
    const total = records.length;
    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    return { subject: sub, present, total, pct };
  });

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-drawer" onClick={e => e.stopPropagation()}>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">{student.name[0].toUpperCase()}</div>
          <div className="profile-info">
            <div className="profile-name">{student.name}</div>
            <div className="profile-meta">
              <span className="roll-badge">{student.rollNumber}</span>
              {(student.subjects || []).map(s => (
                <span key={s} className="subject-tag" style={{ fontSize: '11px' }}>{s}</span>
              ))}
            </div>
          </div>
          <button className="profile-close" onClick={onClose}>×</button>
        </div>

        {/* Quick stats row */}
        {!loading && (
          <div className="profile-stats-row">
            {subjectStats.map(s => {
              const pct = parseFloat(s.pct);
              const color = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
              return (
                <div key={s.subject} className="profile-stat-chip">
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{s.subject}</div>
                  <div style={{ color, fontWeight: 800, fontSize: '18px' }}>{s.pct}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-600)' }}>{s.present}/{s.total} present</div>
                </div>
              );
            })}
            <div className="profile-stat-chip">
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Evaluations</div>
              <div style={{ fontWeight: 800, fontSize: '18px' }}>{evaluations.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-600)' }}>total sessions</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-row" style={{ margin: '0 0 16px 0' }}>
          <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>📋 Attendance</button>
          <button className={`tab-btn ${tab === 'evaluations' ? 'active' : ''}`} onClick={() => setTab('evaluations')}>📝 Evaluations</button>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /><p>Loading...</p></div>
        ) : tab === 'attendance' ? (
          <div className="profile-scroll">
            {Object.keys(attendanceBySubject).length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><p>No attendance records.</p></div>
            ) : (
              Object.entries(attendanceBySubject).map(([sub, records]) => {
                const present = records.filter(r => r.status === 'present').length;
                const pct = ((present / records.length) * 100).toFixed(1);
                const color = parseFloat(pct) >= 75 ? 'var(--success)' : parseFloat(pct) >= 50 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={sub} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{sub}</span>
                      <span style={{ fontWeight: 700, color, fontSize: '13px' }}>{pct}% · {present}/{records.length}</span>
                    </div>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
                      {records.map(r => (
                        <div key={r._id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '9px 14px', borderBottom: '1px solid var(--gray-100)',
                          background: r.status === 'present' ? '#F1F8E9' : '#FFF8F8',
                        }}>
                          <span style={{ color: 'var(--gray-600)', fontSize: '12px', minWidth: '90px' }}>{r.date}</span>
                          {editRecord === r._id ? (
                            <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                              <button className="btn btn-success btn-sm" onClick={() => handleEditStatus(r, 'present')}>Present</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleEditStatus(r, 'absent')}>Absent</button>
                              <button className="btn btn-outline btn-sm" onClick={() => setEditRecord(null)}>✕</button>
                            </div>
                          ) : (
                            <>
                              <span className={`badge badge-${r.status}`} style={{ flex: 1 }}>{r.status}</span>
                              <span style={{ fontSize: '11px', color: 'var(--gray-600)' }}>{r.markedBy?.name || ''}</span>
                              <button className="btn btn-outline btn-sm" onClick={() => setEditRecord(r._id)}>Edit</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="profile-scroll">
            {evaluations.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📝</div><p>No evaluations recorded.</p></div>
            ) : (
              Object.entries(
                evaluations.reduce((acc, e) => {
                  if (!acc[e.subject]) acc[e.subject] = [];
                  acc[e.subject].push(e);
                  return acc;
                }, {})
              ).map(([sub, evals]) => {
                const avg = (evals.reduce((s, e) => s + (e.score / e.maxScore) * 100, 0) / evals.length).toFixed(1);
                const avgColor = parseFloat(avg) >= 70 ? 'var(--success)' : parseFloat(avg) >= 40 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={sub} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{sub}</span>
                      <span style={{ fontWeight: 700, color: avgColor, fontSize: '13px' }}>Avg {avg}% · {evals.length} sessions</span>
                    </div>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
                      {evals.map(e => {
                        const pct = ((e.score / e.maxScore) * 100).toFixed(0);
                        const pctColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
                        return (
                          <div key={e._id} style={{
                            display: 'grid', gridTemplateColumns: '90px 1fr 60px 1fr',
                            gap: '10px', alignItems: 'center',
                            padding: '9px 14px', borderBottom: '1px solid var(--gray-100)',
                          }}>
                            <span style={{ color: 'var(--gray-600)', fontSize: '12px' }}>{e.date}</span>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{e.score}<span style={{ fontWeight: 400, color: 'var(--gray-600)', fontSize: '12px' }}>/{e.maxScore}</span></span>
                            <span style={{ fontWeight: 700, color: pctColor, fontSize: '13px' }}>{pct}%</span>
                            <span style={{ fontSize: '12px', color: 'var(--gray-600)', fontStyle: e.remarks ? 'normal' : 'italic' }}>
                              {e.remarks || 'No remarks'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AttendanceHistory() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [search, setSearch] = useState('');
  const [statsMap, setStatsMap] = useState({}); // studentId → { present, total, pct }
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === 'admin';
  const teacherSubjects = user?.subjects || [];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let allStudents = [];

        if (isAdmin) {
          // Admin: fetch every student in one call
          const stuRes = await api.get('/students');
          allStudents = stuRes.data;

          // Subject list from all teachers
          const teacherRes = await api.get('/admin/teachers');
          const s = new Set();
          teacherRes.data.forEach(t => t.subjects.forEach(sub => s.add(sub)));
          setAllSubjects([...s].sort());
        } else {
          // Teacher: fetch only students enrolled in their own subjects (one call per subject, deduplicated)
          setAllSubjects(teacherSubjects);
          if (teacherSubjects.length > 0) {
            const results = await Promise.all(
              teacherSubjects.map(sub => api.get(`/students?subject=${encodeURIComponent(sub)}`))
            );
            const seen = new Set();
            results.forEach(r => {
              r.data.forEach(s => {
                if (!seen.has(s._id)) { seen.add(s._id); allStudents.push(s); }
              });
            });
            allStudents.sort((a, b) => a.name.localeCompare(b.name));
          }
        }

        setStudents(allStudents);

        // Fetch attendance stats — backend already scopes by teacher's subjects when no subject param
        const statsRes = await api.get('/attendance/stats');
        const map = {};
        statsRes.data.forEach(s => {
          map[s.student._id] = { present: s.present, total: s.total, pct: parseFloat(s.percentage) };
        });
        setStatsMap(map);

      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = students.filter(s => {
    const matchSubject = !filterSubject || (s.subjects || []).includes(filterSubject);
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
    return matchSubject && matchSearch;
  });

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1 className="page-title">History & Stats</h1>
        <p className="page-subtitle">Click any student to view their full attendance and evaluation history</p>
      </div>

      {/* Filters */}
      <div className="card filters-card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-control"
          placeholder="Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '240px' }}
        />
        <select
          className="form-control"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Subjects</option>
          {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterSubject) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setFilterSubject(''); }}>Clear</button>
        )}
        <span className="text-muted" style={{ fontSize: '13px' }}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Student cards grid */}
      {loading ? (
        <div className="loading-wrapper"><div className="spinner" /><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🎓</div>
          <p>{search || filterSubject ? 'No students match your filters.' : 'No students found.'}</p>
        </div>
      ) : (
        <div className="student-profile-grid">
          {filtered.map(s => {
            const stat = statsMap[s._id];
            const pct = stat?.pct ?? null;
            const color = pct === null ? 'var(--gray-400)' : pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
            const present = stat?.present ?? 0;
            const total = stat?.total ?? 0;

            return (
              <div
                key={s._id}
                className="student-profile-card"
                onClick={() => setSelectedStudent(s)}
                title="Click to view full record"
              >
                <div className="spc-avatar">{s.name[0].toUpperCase()}</div>
                <div className="spc-info">
                  <div className="spc-name">{s.name}</div>
                  <div className="spc-roll">{s.rollNumber}</div>
                  <div className="spc-subjects">
                    {(s.subjects || []).map(sub => (
                      <span key={sub} className="subject-tag" style={{ fontSize: '10px', padding: '1px 6px' }}>{sub}</span>
                    ))}
                  </div>
                </div>
                <div className="spc-stat">
                  <div className="spc-pct" style={{ color }}>{pct !== null ? `${pct.toFixed(1)}%` : '—'}</div>
                  <div className="spc-ratio" style={{ color: 'var(--gray-600)' }}>{present}/{total}</div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--gray-100)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct ?? 0}%`, background: color, borderRadius: '2px', transition: 'width 0.4s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Profile Drawer */}
      {selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          teacherSubjects={teacherSubjects}
          isAdmin={isAdmin}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
