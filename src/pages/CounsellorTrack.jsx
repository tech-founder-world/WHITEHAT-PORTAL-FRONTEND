// src/pages/CounsellorTrack.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/CounsellorTrack.css';

export default function CounsellorTrack() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Interview Modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewStudent, setInterviewStudent] = useState(null);
  const [interviewStatus, setInterviewStatus] = useState('shortlisted');

  // Form for Counsellor to edit
  const [editForm, setEditForm] = useState({
    studentName: '',
    batchName: '',
    courseType: 'Silver',
    totalFees: 0,
    feesPaid: 0,
    joinedDate: '',
    endedDate: '',
    status: 'active'
  });

  // ✅ AUTO-FILTER WHEN SEARCH TERM CHANGES
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredStudents(students);
      return;
    }
    const filtered = students.filter(student => 
      student.studentName.toLowerCase().includes(term) ||
      student.batchName?.toLowerCase().includes(term) ||
      student.branch.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/placement/applications/all'); 
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- OPEN EDIT MODAL ---
  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      studentName: student.studentName,
      batchName: student.batchName || '',
      courseType: student.courseType || 'Silver',
      totalFees: student.totalFees || 0,
      feesPaid: student.feesPaid || 0,
      joinedDate: student.joinedDate ? new Date(student.joinedDate).toISOString().split('T')[0] : '',
      endedDate: student.endedDate ? new Date(student.endedDate).toISOString().split('T')[0] : '',
      status: student.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // --- SAVE TRAINING DETAILS ---
  const saveStudentDetails = async () => {
    try {
      await api.put(`/placement/applications/${editingStudent._id}/counsellor-update`, {
        studentName: editForm.studentName,
        batchName: editForm.batchName,
        courseType: editForm.courseType,
        totalFees: editForm.totalFees,
        feesPaid: editForm.feesPaid,
        joinedDate: editForm.joinedDate,
        endedDate: editForm.endedDate,
        status: editForm.status
      });
      
      fetchStudents();
      setShowEditModal(false);
      alert('✅ Student training details updated successfully!');
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Error updating student. Please try again.');
    }
  };

  // --- LOG INTERVIEW ---
  const openInterviewModal = (student) => {
    setInterviewStudent(student);
    setInterviewStatus('shortlisted');
    setShowInterviewModal(true);
  };

  const logInterview = async () => {
    try {
      await api.post(`/placement/applications/${interviewStudent._id}/interview`, {
        status: interviewStatus
      });
      
      fetchStudents();
      setShowInterviewModal(false);
      alert('✅ Interview logged successfully!');
    } catch (err) {
      console.error('Error logging interview:', err);
      alert('Error logging interview.');
    }
  };

  // Helper to count array items
  const countInterviews = (student, status) => {
    if (!student.interviews) return 0;
    return student.interviews.filter(i => i.status === status).length;
  };

  return (
    <div className="track-page">
      <div className="track-header">
        <div>
          <h1 className="page-title">📊 Student Training Tracker</h1>
          <p className="page-subtitle">Update fees, batches, and interview logs for students</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input 
          type="text" 
          placeholder="🔍 Search by name, batch, or branch..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Stats Summary */}
      <div className="track-stats">
        <div className="stat-card">
          <span className="stat-label">Total Students</span>
          <span className="stat-value">{students.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Interviews</span>
          <span className="stat-value">
            {students.reduce((sum, s) => sum + (s.interviews?.length || 0), 0)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Shortlisted</span>
          <span className="stat-value">
            {students.reduce((sum, s) => sum + countInterviews(s, 'shortlisted'), 0)}
          </span>
        </div>
      </div>

      {/* Student Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <p>No students found matching your search.</p>
          </div>
        ) : (
          <table className="track-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Batch</th>
                <th>Course</th>
                <th>Total Fees</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Due</th>
                <th>Joined</th>
                <th>Ended</th>
                <th>Interviews</th>
                <th>Shortlisted</th>
                <th>Selected</th>
                <th>Rejected</th>
                <th>Status</th>
                <th>Actions</th>
                <th style={{ textAlign: 'center' }}>Export</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td><strong>{student.studentName}</strong></td>
                  <td>{student.batchName || '-'}</td>
                  <td>
                    <span className={`course-badge ${student.courseType?.toLowerCase() || 'silver'}`}>
                      {student.courseType || 'Silver'}
                    </span>
                  </td>
                  <td>₹{student.totalFees || 0}</td>
                  <td style={{ color: '#16a34a', fontWeight: '600' }}>₹{student.feesPaid || 0}</td>
                  <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{(student.totalFees || 0) - (student.feesPaid || 0)}</td>
                  <td>
                    <span style={{ 
                      background: (student.totalFees || 0) - (student.feesPaid || 0) <= 0 ? '#d1fae5' : '#fee2e2', 
                      color: (student.totalFees || 0) - (student.feesPaid || 0) <= 0 ? '#065f46' : '#991b1b', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600' 
                    }}>
                      {(student.totalFees || 0) - (student.feesPaid || 0) <= 0 ? '✅ Clear' : '⚠️ Due'}
                    </span>
                  </td>
                  <td>{student.joinedDate ? new Date(student.joinedDate).toLocaleDateString() : '-'}</td>
                  <td>{student.endedDate ? new Date(student.endedDate).toLocaleDateString() : '-'}</td>
                  <td className="text-center">{student.interviews?.length || 0}</td>
                  <td className="text-center text-green">{countInterviews(student, 'shortlisted')}</td>
                  <td className="text-center text-green">{countInterviews(student, 'selected')}</td>
                  <td className="text-center text-red">{countInterviews(student, 'rejected')}</td>
                  <td>
                    <span className={`status-pill ${student.status || 'active'}`}>
                      {student.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button onClick={() => openEditModal(student)} className="btn-edit-small">
                        ✏️ Edit
                      </button>
                      <button onClick={() => openInterviewModal(student)} style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                        🎤 Log Interview
                      </button>
                    </div>
                  </td>

                  {/* SINGLE STUDENT CSV DOWNLOAD BUTTON */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        const headers = ['Name','Email','Phone','ID','Branch','CGPA','Batch','Course','Total Fees','Paid','Pending','Due','Joined','Ended','Total Interviews','Shortlisted','Selected','Rejected','Status'];
                        const row = [
                          `"${student.studentName}"`, `"${student.studentEmail}"`, `"${student.studentPhone || ''}"`,
                          `"${student.studentId || ''}"`, `"${student.branch}"`, student.cgpa,
                          `"${student.batchName || ''}"`, `"${student.courseType || 'Silver'}"`,
                          student.totalFees || 0, student.feesPaid || 0, (student.totalFees || 0) - (student.feesPaid || 0),
                          (student.totalFees || 0) - (student.feesPaid || 0) <= 0 ? 'Clear' : 'Due',
                          `"${student.joinedDate ? new Date(student.joinedDate).toLocaleDateString() : ''}"`,
                          `"${student.endedDate ? new Date(student.endedDate).toLocaleDateString() : ''}"`,
                          student.interviews?.length || 0,
                          countInterviews(student, 'shortlisted'),
                          countInterviews(student, 'selected'),
                          countInterviews(student, 'rejected'),
                          `"${student.status || 'active'}"`
                        ];
                        const csvContent = [headers, row].map(row => row.join(',')).join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${student.studentName}_Record.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      style={{ background: '#f3f4f6', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
                      title="Download this student's record"
                    >
                      📥
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- EDIT TRAINING MODAL --- */}
      {showEditModal && editingStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Update Student Training</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Student Name</label>
                  <input type="text" name="studentName" value={editForm.studentName} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Batch Name</label>
                  <input type="text" name="batchName" value={editForm.batchName} onChange={handleEditChange} placeholder="e.g. Batch 2026-A" />
                </div>
                <div className="form-group">
                  <label>Course Type</label>
                  <select name="courseType" value={editForm.courseType} onChange={handleEditChange}>
                    <option value="Silver">Silver</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Fees (₹)</label>
                  <input type="number" name="totalFees" value={editForm.totalFees} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Fees Paid (₹)</label>
                  <input type="number" name="feesPaid" value={editForm.feesPaid} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Joined Date</label>
                  <input type="date" name="joinedDate" value={editForm.joinedDate} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Ended Date</label>
                  <input type="date" name="endedDate" value={editForm.endedDate} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
              </div>
              <p className="note">* Interviews are logged separately using the "Log Interview" button.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveStudentDetails} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- LOG INTERVIEW MODAL --- */}
      {showInterviewModal && interviewStudent && (
        <div className="modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎤 Log Interview for {interviewStudent.studentName}</h3>
              <button className="modal-close" onClick={() => setShowInterviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Interview Result</label>
                <select value={interviewStatus} onChange={(e) => setInterviewStatus(e.target.value)} className="form-control">
                  <option value="shortlisted">✅ Shortlisted</option>
                  <option value="selected">🏆 Selected</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowInterviewModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={logInterview} className="btn-primary">Log Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}