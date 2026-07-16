import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/MarkAttendance.css';

export default function MarkAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [existingRecords, setExistingRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const subjects = user?.subjects || [];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch only students enrolled in the selected subject
  useEffect(() => {
    if (!subject) {
      setStudents([]);
      setAttendance({});
      return;
    }
    setLoading(true);
    api.get(`/students?subject=${encodeURIComponent(subject)}`)
      .then(r => setStudents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [subject]);

  // Load existing attendance when subject + date + students change
  useEffect(() => {
    if (!subject || !date || students.length === 0) return;
    setLoading(true);
    api.get(`/attendance?subject=${encodeURIComponent(subject)}&date=${date}`)
      .then(r => {
        setExistingRecords(r.data);
        const map = {};
        r.data.forEach(rec => { map[rec.student._id] = rec.status; });
        // Default absent for students not yet recorded
        students.forEach(s => {
          if (!map[s._id]) map[s._id] = 'absent';
        });
        setAttendance(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [subject, date, students]);

  const toggle = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s._id] = status; });
    setAttendance(map);
  };

  const handleSubmit = async () => {
    if (!subject) return showToast('Please select a subject', 'error');
    if (!date) return showToast('Please select a date', 'error');
    if (students.length === 0) return showToast('No enrolled students found for this subject', 'error');

    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendance[s._id] || 'absent',
      }));
      await api.post('/attendance/bulk', { records, subject, date });
      showToast('Attendance saved successfully ✅');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving attendance', 'error');
    } finally { setSaving(false); }
  };

  const presentCount = students.filter(s => attendance[s._id] === 'present').length;
  const absentCount = students.length - presentCount;
  const isEditing = existingRecords.length > 0;

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Select a subject and date — only enrolled students will appear</p>
      </div>

      {/* Controls */}
      <div className="card attendance-controls">
        <div className="controls-grid">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Subject</label>
            <select className="form-control" value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">— Select Subject —</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date</label>
            <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {isEditing && (
          <div className="editing-notice">
            ✏️ Editing existing attendance record for {date}
          </div>
        )}
      </div>

      {subject && (
        <>
          {/* Enrollment info banner */}
          {!loading && students.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '24px' }}>
              <div className="empty-icon">📋</div>
              <p>No students are enrolled in <strong>{subject}</strong> yet.</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Go to Students and add <strong>{subject}</strong> as a subject for the relevant students.
              </p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="attendance-summary">
                <div className="summary-stat">
                  <span className="summary-num">{students.length}</span>
                  <span className="summary-label">Enrolled</span>
                </div>
                <div className="summary-stat present">
                  <span className="summary-num">{presentCount}</span>
                  <span className="summary-label">Present</span>
                </div>
                <div className="summary-stat absent">
                  <span className="summary-num">{absentCount}</span>
                  <span className="summary-label">Absent</span>
                </div>
                <div className="summary-actions">
                  <button className="btn btn-success btn-sm" onClick={() => markAll('present')}>Mark All Present</button>
                  <button className="btn btn-danger btn-sm" onClick={() => markAll('absent')}>Mark All Absent</button>
                </div>
              </div>

              {/* Student list */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                  <div className="loading-wrapper"><div className="spinner" /><p>Loading enrolled students...</p></div>
                ) : (
                  <div className="student-list">
                    {students.map((s, i) => {
                      const status = attendance[s._id] || 'absent';
                      return (
                        <div key={s._id} className={`student-row ${status}`}>
                          <div className="student-index">{i + 1}</div>
                          <div className="student-info">
                            <div className="student-name">{s.name}</div>
                            <div className="student-meta">
                              {s.rollNumber}
                              {(s.subjects || []).length > 1 && (
                                <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                  · also enrolled in {(s.subjects || []).filter(sub => sub !== subject).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="attendance-toggle">
                            <button
                              className={`toggle-btn present-btn ${status === 'present' ? 'active' : ''}`}
                              onClick={() => toggle(s._id, 'present')}
                            >P</button>
                            <button
                              className={`toggle-btn absent-btn ${status === 'absent' ? 'active' : ''}`}
                              onClick={() => toggle(s._id, 'absent')}
                            >A</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {students.length > 0 && !loading && (
                <div className="submit-row">
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving...' : isEditing ? '✏️ Update Attendance' : '✅ Save Attendance'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!subject && (
        <div className="empty-state" style={{ marginTop: '24px' }}>
          <div className="empty-icon">📋</div>
          <p>Select a subject above to begin marking attendance.</p>
          {subjects.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              You have no subjects assigned. Contact your admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
