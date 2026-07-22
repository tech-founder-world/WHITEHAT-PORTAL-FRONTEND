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

  // Form for Counsellor to edit
  const [editForm, setEditForm] = useState({
    batchName: '',
    courseType: 'Silver',
    totalFees: 0,
    feesPaid: 0,
    joinedDate: '',
    endedDate: '',
    totalInterviewsGiven: 0,
    totalInterviewsRejected: 0
  });

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

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = students.filter(student => 
      student.studentName.toLowerCase().includes(term) ||
      student.batchName?.toLowerCase().includes(term) ||
      student.branch.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  };

  // --- OPEN EDIT MODAL ---
  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      batchName: student.batchName || '',
      courseType: student.courseType || 'Silver',
      totalFees: student.totalFees || 0,
      feesPaid: student.feesPaid || 0,
      joinedDate: student.joinedDate ? new Date(student.joinedDate).toISOString().split('T')[0] : '',
      endedDate: student.endedDate ? new Date(student.endedDate).toISOString().split('T')[0] : '',
      totalInterviewsGiven: student.totalInterviewsGiven || 0,
      totalInterviewsRejected: student.totalInterviewsRejected || 0
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // --- SAVE AND INSTANTLY UPDATE ---
  const saveStudentDetails = async () => {
    try {
      await api.put(`/placement/applications/${editingStudent._id}/counsellor-update`, {
        batchName: editForm.batchName,
        courseType: editForm.courseType,
        totalFees: editForm.totalFees,
        feesPaid: editForm.feesPaid,
        joinedDate: editForm.joinedDate,
        endedDate: editForm.endedDate,
        totalInterviewsGiven: Number(editForm.totalInterviewsGiven),
        totalInterviewsRejected: Number(editForm.totalInterviewsRejected)
      });
      
      // ✅ INSTANTLY REFRESH DATA FOR BOTH ADMIN AND COUNSELLOR
      fetchStudents();
      setShowEditModal(false);
      alert('✅ Student updated successfully!');
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Error updating student. Please try again.');
    }
  };

  return (
    <div className="track-page">
      <div className="track-header">
        <div>
          <h1 className="page-title">📊 Student Training Tracker</h1>
          <p className="page-subtitle">Update batches, fees, and interview stats</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input 
          type="text" 
          placeholder="🔍 Search by name, batch, or branch..." 
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

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
                <th>Selected</th>
                <th>Rejected</th>
                <th>Status</th>
                <th>Actions</th>
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
                  <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{student.feesPending || 0}</td>
                  <td>
                    <span style={{ 
                      background: student.dueClear ? '#d1fae5' : '#fee2e2', 
                      color: student.dueClear ? '#065f46' : '#991b1b', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600' 
                    }}>
                      {student.dueClear ? '✅ Clear' : '⚠️ Due'}
                    </span>
                  </td>
                  <td>{student.joinedDate ? new Date(student.joinedDate).toLocaleDateString() : '-'}</td>
                  <td>{student.endedDate ? new Date(student.endedDate).toLocaleDateString() : '-'}</td>
                  <td className="text-center">{student.totalInterviewsGiven || 0}</td>
                  <td className="text-center text-green">{student.totalInterviewsSelected || 0}</td>
                  <td className="text-center text-red">{student.totalInterviewsRejected || 0}</td>
                  <td>
                    <span className={`status-pill ${student.status || 'active'}`}>
                      {student.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(student)} className="btn-edit-small">
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- EDIT MODAL (Exactly 8 Fields) --- */}
      {showEditModal && editingStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>✏️ Update Student</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div className="form-group">
                  <label>Batch Name</label>
                  <input type="text" name="batchName" value={editForm.batchName} onChange={handleEditChange} />
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
                  <label>Total Interviews</label>
                  <input type="number" name="totalInterviewsGiven" value={editForm.totalInterviewsGiven} onChange={handleEditChange} />
                </div>

                <div className="form-group">
                  <label>Interviews Rejected</label>
                  <input type="number" name="totalInterviewsRejected" value={editForm.totalInterviewsRejected} onChange={handleEditChange} />
                </div>

              </div>
              <p className="note">* Selected interviews are auto-calculated based on given and rejected counts.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveStudentDetails} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}