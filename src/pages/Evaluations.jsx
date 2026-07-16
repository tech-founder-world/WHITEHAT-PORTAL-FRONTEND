import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Evaluations() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // default today
  const [subjectList, setSubjectList] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({}); // { studentId: { score, maxScore, remarks, existingId } }
  const [maxScoreGlobal, setMaxScoreGlobal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Build subject list: teachers use their own subjects, admin fetches from all teachers
  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/teachers')
        .then(r => {
          const s = new Set();
          r.data.forEach(t => t.subjects.forEach(sub => s.add(sub)));
          setSubjectList([...s].sort());
        })
        .catch(console.error);
    } else {
      // Teacher: use their own assigned subjects directly — no admin API call needed
      setSubjectList(user?.subjects || []);
    }
  }, [isAdmin, user]);

  // Fetch students enrolled in selected subject
  useEffect(() => {
    if (!subject) { setStudents([]); setScores({}); return; }
    setLoading(true);
    api.get(`/students?subject=${encodeURIComponent(subject)}`)
      .then(r => {
        setStudents(r.data);
        const init = {};
        r.data.forEach(s => {
          init[s._id] = { score: '', maxScore: maxScoreGlobal, remarks: '', existingId: null };
        });
        setScores(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [subject]);

  // Load existing evaluations when subject + date change
  useEffect(() => {
    if (!subject || !date || students.length === 0) return;
    api.get(`/evaluations?subject=${encodeURIComponent(subject)}&date=${date}`)
      .then(r => {
        setScores(prev => {
          const updated = { ...prev };
          // Reset to blank for all current students
          students.forEach(s => {
            updated[s._id] = { score: '', maxScore: updated[s._id]?.maxScore ?? maxScoreGlobal, remarks: '', existingId: null };
          });
          // Fill in what exists
          r.data.forEach(rec => {
            const sid = rec.student._id;
            if (updated[sid] !== undefined) {
              updated[sid] = { score: rec.score, maxScore: rec.maxScore, remarks: rec.remarks || '', existingId: rec._id };
            }
          });
          return updated;
        });
      })
      .catch(console.error);
  }, [subject, date, students]);

  const updateScore = (studentId, field, value) => {
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const applyMaxScore = () => {
    setScores(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => { updated[id] = { ...updated[id], maxScore: Number(maxScoreGlobal) }; });
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!subject) return showToast('Select a subject', 'error');
    if (!date) return showToast('Select a date', 'error');

    for (const s of Object.values(scores)) {
      if (s.score === '' || s.score === null) continue;
      if (isNaN(Number(s.score)) || Number(s.score) < 0)
        return showToast('Scores must be valid non-negative numbers', 'error');
      if (Number(s.score) > Number(s.maxScore))
        return showToast('A score exceeds its max score', 'error');
    }

    const records = students
      .filter(s => scores[s._id]?.score !== '' && scores[s._id]?.score !== null && scores[s._id]?.score !== undefined)
      .map(s => ({
        studentId: s._id,
        score: Number(scores[s._id].score),
        maxScore: Number(scores[s._id].maxScore) || 100,
        remarks: scores[s._id].remarks || '',
      }));

    if (records.length === 0) return showToast('No scores entered yet', 'error');

    setSaving(true);
    try {
      await api.post('/evaluations/bulk', { records, subject, date });
      showToast(`Saved ${records.length} evaluation${records.length !== 1 ? 's' : ''} ✅`);

      // Refresh existingId flags
      const r = await api.get(`/evaluations?subject=${encodeURIComponent(subject)}&date=${date}`);
      setScores(prev => {
        const updated = { ...prev };
        r.data.forEach(rec => {
          if (updated[rec.student._id]) updated[rec.student._id].existingId = rec._id;
        });
        return updated;
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving', 'error');
    } finally { setSaving(false); }
  };

  const filledCount = students.filter(s => {
    const sc = scores[s._id]?.score;
    return sc !== '' && sc !== null && sc !== undefined;
  }).length;

  const isEditing = students.some(s => scores[s._id]?.existingId);

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1 className="page-title">Evaluations</h1>
        <p className="page-subtitle">Record evaluation scores for any date — only enrolled students are shown per subject</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Subject</label>
            <select className="form-control" value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">— Select Subject —</option>
              {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Max Score — apply to all</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                className="form-control"
                value={maxScoreGlobal}
                min={1}
                onChange={e => setMaxScoreGlobal(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-outline btn-sm" onClick={applyMaxScore} style={{ whiteSpace: 'nowrap' }}>
                Apply
              </button>
            </div>
          </div>
        </div>

        {subject && date && (
          <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>📅 {formattedDate}</span>
            {isEditing && (
              <span style={{ fontSize: '12px', padding: '3px 10px', background: 'var(--info-bg)', color: 'var(--info)', borderRadius: '20px', fontWeight: 600 }}>
                ✏️ Editing existing record
              </span>
            )}
          </div>
        )}
      </div>

      {/* Student score table */}
      {subject && date ? (
        loading ? (
          <div className="loading-wrapper"><div className="spinner" /><p>Loading students...</p></div>
        ) : students.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📝</div>
            <p>No students enrolled in <strong>{subject}</strong>.</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Go to Students and add {subject} as a subject for the relevant students.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '44px 1fr 120px 1fr 72px',
                gap: '12px', padding: '10px 20px',
                borderBottom: '2px solid var(--gray-100)',
                background: 'var(--off-white)',
                fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                <div>#</div>
                <div>Student</div>
                <div style={{ textAlign: 'center' }}>Score / Max</div>
                <div>Remarks</div>
                <div style={{ textAlign: 'center' }}>%</div>
              </div>

              {students.map((s, i) => {
                const entry = scores[s._id] || { score: '', maxScore: maxScoreGlobal, remarks: '', existingId: null };
                const scoreNum = Number(entry.score);
                const maxNum = Number(entry.maxScore) || 100;
                const hasScore = entry.score !== '' && entry.score !== null && entry.score !== undefined;
                const pct = hasScore ? ((scoreNum / maxNum) * 100).toFixed(0) : null;
                const pctColor = pct === null
                  ? 'var(--gray-400)'
                  : pct >= 70 ? 'var(--success)'
                  : pct >= 40 ? 'var(--warning)'
                  : 'var(--danger)';

                return (
                  <div
                    key={s._id}
                    style={{
                      display: 'grid', gridTemplateColumns: '44px 1fr 120px 1fr 72px',
                      gap: '12px', alignItems: 'center',
                      padding: '11px 20px',
                      borderBottom: '1px solid var(--gray-100)',
                      background: entry.existingId ? 'rgba(46,125,50,0.04)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ color: 'var(--gray-600)', fontSize: '12px', fontWeight: 600 }}>{i + 1}</div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {s.name}
                        {entry.existingId && (
                          <span style={{ fontSize: '10px', background: 'var(--success-bg)', color: 'var(--success)', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>saved</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-600)', fontFamily: 'monospace' }}>{s.rollNumber}</div>
                    </div>

                    {/* Score / Max as two inputs side-by-side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Score"
                        value={entry.score}
                        min={0}
                        max={maxNum}
                        onChange={e => updateScore(s._id, 'score', e.target.value)}
                        style={{ textAlign: 'center', padding: '6px 4px', fontSize: '13px' }}
                      />
                      <span style={{ color: 'var(--gray-400)', fontSize: '12px', flexShrink: 0 }}>/</span>
                      <input
                        type="number"
                        className="form-control"
                        value={entry.maxScore}
                        min={1}
                        onChange={e => updateScore(s._id, 'maxScore', e.target.value)}
                        style={{ textAlign: 'center', padding: '6px 4px', fontSize: '13px', width: '52px', flexShrink: 0 }}
                      />
                    </div>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Remarks (optional)"
                      value={entry.remarks}
                      onChange={e => updateScore(s._id, 'remarks', e.target.value)}
                      style={{ fontSize: '13px' }}
                    />

                    <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', color: pctColor }}>
                      {pct !== null ? `${pct}%` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                {filledCount} of {students.length} students scored
              </span>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : isEditing ? '✏️ Update Evaluations' : '✅ Save Evaluations'}
              </button>
            </div>
          </>
        )
      ) : (
        <div className="empty-state" style={{ marginTop: '24px' }}>
          <div className="empty-icon">📝</div>
          <p>Select a subject and date above to enter evaluation scores.</p>
          {!isAdmin && subjectList.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginTop: '8px' }}>
              You have no subjects assigned. Contact your admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
