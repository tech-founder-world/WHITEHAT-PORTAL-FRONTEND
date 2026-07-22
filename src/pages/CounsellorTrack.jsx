import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/CounsellorTrack.css';

export default function CounsellorTrack() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch REAL data from Placement Applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching placement applications for counsellor...");
      const response = await api.get("/placement/applications/all");
      console.log("✅ Applications loaded:", response.data?.length || 0);
      setApplications(response.data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      showToast("Error loading applications", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (application) => {
    setEditingId(application._id);
    setEditData({
      branch: application.branch || "",
      courseType: application.courseType || "Silver",
      totalFees: application.totalFees || 0,
      feesPaid: application.feesPaid || 0,
      feesPending: application.feesPending || 0,
      joinedDate: application.joinedDate ? new Date(application.joinedDate).toISOString().split('T')[0] : "",
      endedDate: application.endedDate ? new Date(application.endedDate).toISOString().split('T')[0] : "",
      totalInterviewsGiven: application.totalInterviewsGiven || 0,
      totalInterviewsRejected: application.totalInterviewsRejected || 0,
      totalInterviewsSelected: application.totalInterviewsSelected || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleInputChange = (e, field) => {
    setEditData({
      ...editData,
      [field]: e.target.value,
    });
  };

  const handleSaveEdit = async (applicationId) => {
    try {
      const payload = {
        branch: editData.branch,
        courseType: editData.courseType,
        totalFees: Number(editData.totalFees) || 0,
        feesPaid: Number(editData.feesPaid) || 0,
        joinedDate: editData.joinedDate || null,
        endedDate: editData.endedDate || null,
        totalInterviewsGiven: Number(editData.totalInterviewsGiven) || 0,
        totalInterviewsRejected: Number(editData.totalInterviewsRejected) || 0,
      };

      console.log("📦 Updating application:", payload);
      const response = await api.put(`/placement/applications/${applicationId}/counsellor-update`, payload);
      
      if (response.data.success) {
        showToast("✅ Student updated successfully!");
        setEditingId(null);
        fetchApplications();
      }
    } catch (err) {
      console.error("Error updating application:", err);
      showToast(err.response?.data?.message || "Error updating student", "error");
    }
  };

  // Handle adding interview log
  const handleAddInterview = async (applicationId, status, notes) => {
    try {
      const response = await api.post(`/placement/applications/${applicationId}/interview`, {
        status,
        notes
      });
      
      if (response.data.success) {
        showToast("✅ Interview logged successfully!");
        fetchApplications();
        // Refresh the modal data
        if (selectedStudent) {
          const updatedStudent = await api.get(`/placement/applications/${applicationId}`);
          setSelectedStudent(updatedStudent.data);
        }
      }
    } catch (err) {
      console.error("Error adding interview:", err);
      showToast(err.response?.data?.message || "Error logging interview", "error");
    }
  };

  const viewStudentDetails = async (student) => {
    try {
      const response = await api.get(`/placement/applications/${student._id}`);
      setSelectedStudent(response.data);
      setShowInterviewModal(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      showToast('Error loading student details', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      shortlisted: '#3b82f6',
      selected: '#22c55e',
      rejected: '#ef4444',
      interview_scheduled: '#8b5cf6'
    };
    return {
      background: colors[status] || '#6b7280',
      color: 'white'
    };
  };

  const getCourseLabel = (type) => {
    const labels = {
      Silver: "🥈 Silver",
      Platinum: "🥇 Platinum",
      Premium: "👑 Premium",
    };
    return labels[type] || type || "Silver";
  };

  return (
    <div className="counsellor-track">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1 className="page-title">🎯 Student Tracker</h1>
        <p className="page-subtitle">Track and update student placement applications</p>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          📊 Total Students: {applications.length}
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner" />
            <p>Loading student data...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No student applications found</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Students haven't submitted any placement forms yet
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="track-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Form</th>
                  <th>Course</th>
                  <th>Total Fees</th>
                  <th>Paid</th>
                  <th>Pending</th>
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
                {applications.map((app, index) => {
                  const isEditing = editingId === app._id;

                  if (isEditing) {
                    return (
                      <tr key={app._id} className="editing-row">
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={app.studentName}
                            disabled
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={app.studentEmail}
                            disabled
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={app.studentPhone || "N/A"}
                            disabled
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={app.placementForm?.formTitle || "N/A"}
                            disabled
                          />
                        </td>
                        <td>
                          <select
                            className="form-control form-control-sm"
                            value={editData.courseType}
                            onChange={(e) => handleInputChange(e, "courseType")}
                          >
                            <option value="Silver">Silver</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Premium">Premium</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editData.totalFees}
                            onChange={(e) => handleInputChange(e, "totalFees")}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editData.feesPaid}
                            onChange={(e) => handleInputChange(e, "feesPaid")}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editData.feesPending}
                            disabled
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={editData.joinedDate}
                            onChange={(e) => handleInputChange(e, "joinedDate")}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={editData.endedDate}
                            onChange={(e) => handleInputChange(e, "endedDate")}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editData.totalInterviewsGiven}
                            onChange={(e) => handleInputChange(e, "totalInterviewsGiven")}
                            min="0"
                          />
                        </td>
                        <td style={{ color: "#16a34a", fontWeight: "bold" }}>
                          {editData.totalInterviewsGiven - editData.totalInterviewsRejected}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editData.totalInterviewsRejected}
                            onChange={(e) => handleInputChange(e, "totalInterviewsRejected")}
                            min="0"
                          />
                        </td>
                        <td>
                          <span className="status-pill" style={{ background: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                            {app.status || "pending"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleSaveEdit(app._id)}
                            >
                              💾 Save
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={handleCancelEdit}
                            >
                              ✖ Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={app._id} 
                      onClick={() => viewStudentDetails(app)} 
                      style={{ cursor: 'pointer' }}
                      className="clickable-row"
                    >
                      <td>{index + 1}</td>
                      <td><strong>{app.studentName}</strong></td>
                      <td>{app.studentEmail}</td>
                      <td>{app.studentPhone || "N/A"}</td>
                      <td>{app.placementForm?.formTitle || "N/A"}</td>
                      <td>
                        <span className={`course-pill ${app.courseType?.toLowerCase() || "silver"}`}>
                          {getCourseLabel(app.courseType)}
                        </span>
                      </td>
                      <td>₹{app.totalFees || 0}</td>
                      <td style={{ color: "#16a34a" }}>₹{app.feesPaid || 0}</td>
                      <td style={{ color: (app.feesPending || 0) > 0 ? "#dc2626" : "#16a34a" }}>
                        ₹{app.feesPending || 0}
                      </td>
                      <td>{formatDate(app.joinedDate)}</td>
                      <td>{formatDate(app.endedDate)}</td>
                      <td>{app.totalInterviewsGiven || 0}</td>
                      <td style={{ color: "#16a34a", fontWeight: "bold" }}>
                        {app.totalInterviewsSelected || 0}
                      </td>
                      <td style={{ color: "#dc2626" }}>{app.totalInterviewsRejected || 0}</td>
                      <td>
                        <span 
                          className="status-pill" 
                          style={{ 
                            background: getStatusBadge(app.status).background, 
                            color: 'white',
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "500",
                            display: "inline-block"
                          }}
                        >
                          {app.status || "pending"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); handleEditClick(app); }}
                          >
                            ✏️ Update
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={(e) => { e.stopPropagation(); viewStudentDetails(app); }}
                          >
                            📊 Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Details & Interview Modal */}
      {showInterviewModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📊 Student Details: <span style={{ color: '#f97316' }}>{selectedStudent.studentName}</span></h3>
              <button className="modal-close" onClick={() => setShowInterviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Student Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div><strong>Email:</strong> {selectedStudent.studentEmail}</div>
                <div><strong>Phone:</strong> {selectedStudent.studentPhone}</div>
                <div><strong>Father's Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                <div><strong>Course:</strong> {selectedStudent.courseType}</div>
                <div><strong>Timing:</strong> {selectedStudent.courseTiming || 'N/A'}</div>
                <div><strong>Branch:</strong> {selectedStudent.branch || 'N/A'}</div>
                <div><strong>Total Fees:</strong> ₹{selectedStudent.totalFees || 0}</div>
                <div><strong>Fees Paid:</strong> ₹{selectedStudent.feesPaid || 0}</div>
                <div><strong>Fees Pending:</strong> ₹{selectedStudent.feesPending || 0}</div>
                <div><strong>Joined:</strong> {formatDate(selectedStudent.joinedDate)}</div>
                <div><strong>Ended:</strong> {formatDate(selectedStudent.endedDate)}</div>
                <div><strong>Resume:</strong> {selectedStudent.resumeLink ? <a href={selectedStudent.resumeLink} target="_blank" rel="noopener noreferrer">🔗 View</a> : 'N/A'}</div>
              </div>

              {/* Add Interview Section */}
              <div style={{ marginBottom: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>➕ Add Interview Log</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    id="interviewStatus"
                    className="form-control" 
                    style={{ maxWidth: '180px' }}
                  >
                    <option value="shortlisted">Shortlisted</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="pending">Pending</option>
                  </select>
                  <input 
                    type="text" 
                    id="interviewNotes"
                    placeholder="Add notes..." 
                    className="form-control" 
                    style={{ flex: 1, minWidth: '150px' }}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const status = document.getElementById('interviewStatus').value;
                      const notes = document.getElementById('interviewNotes').value;
                      if (notes) {
                        handleAddInterview(selectedStudent._id, status, notes);
                        document.getElementById('interviewNotes').value = '';
                      } else {
                        showToast('Please add notes for the interview', 'error');
                      }
                    }}
                  >
                    ➕ Add
                  </button>
                </div>
              </div>

              {/* Interview History */}
              <h4 style={{ margin: '0 0 10px 0' }}>📋 Interview History</h4>
              {selectedStudent.interviewLogs?.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No interview records yet.</p>
              ) : (
                <table className="interview-logs-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Updated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.interviewLogs?.map((log, idx) => (
                      <tr key={idx}>
                        <td>{new Date(log.date).toLocaleDateString()}</td>
                        <td>
                          <span style={{ 
                            background: getStatusBadge(log.status).background, 
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {log.status}
                          </span>
                        </td>
                        <td>{log.notes || '-'}</td>
                        <td>{log.updatedBy?.name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Summary Stats */}
              <div style={{ marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                <div><strong>Total Interviews:</strong> {selectedStudent.totalInterviewsGiven || 0}</div>
                <div style={{ color: '#3b82f6' }}><strong>Shortlisted:</strong> {selectedStudent.totalInterviewsShortlisted || 0}</div>
                <div style={{ color: '#16a34a' }}><strong>Selected:</strong> {selectedStudent.totalInterviewsSelected || 0}</div>
                <div style={{ color: '#dc2626' }}><strong>Rejected:</strong> {selectedStudent.totalInterviewsRejected || 0}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowInterviewModal(false)} className="cancel-btn">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}