// src/components/Placement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Placement.css';

const API_BASE = 'http://localhost:5000/api';

function Placement() {
  // ✅ FIXED: Added 'user' here!
  const { token, user } = useAuth();
  
  // --- STATES ---
  const [showModal, setShowModal] = useState(false);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState(''); 
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- STATES FOR VIEW MODAL ---
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [selectedPlacementTitle, setSelectedPlacementTitle] = useState('');

  // --- SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- FORM STATE (Removed all job fields) ---
  const [formData, setFormData] = useState({
    formTitle: "", 
    description: "", 
    expiryDate: ""
  });

  useEffect(() => {
    if (token) loadPlacements();
  }, [token]);

  const loadPlacements = async () => {
    try {
      const res = await fetch(`${API_BASE}/placement/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlacements(data);
      }
    } catch (error) {
      console.error('Error loading placements:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- CREATE OR UPDATE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCreatedLink('');

    try {
      let url = `${API_BASE}/placement/create`;
      let method = 'POST';

      if (isEditing && editingId) {
        url = `${API_BASE}/placement/update/${editingId}`;
        method = 'PUT';
      }

      // We only send what the user filled out
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      if (!isEditing) {
        setCreatedLink(data.shareableLink);
      } else {
        alert('✅ Form updated successfully!');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({ formTitle: "", description: "", expiryDate: "" });
      loadPlacements();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- SHARE FUNCTION ---
  const handleShare = async (placement) => {
    const fullLink = `${window.location.origin}/apply/${placement.formLink.replace('placement/', '')}`;
    try {
      await navigator.clipboard.writeText(fullLink);
      alert(`✅ Link copied to clipboard!\n\n${fullLink}`);
    } catch (err) {
      alert("Failed to copy link. Please copy it manually.");
    }
  };

  // --- TOGGLE ACTIVE/INACTIVE ---
  const handleToggleActive = async (placement) => {
    const newStatus = !placement.isActive;
    if(!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this form?`)) return;
    try {
      const res = await fetch(`${API_BASE}/placement/${placement._id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (res.ok) loadPlacements();
      else alert('Failed to update status.');
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // --- DELETE FUNCTION ---
  const handleDelete = async (placementId) => {
    if (!confirm("Are you sure you want to DELETE this form and all its student data? This cannot be undone!")) return;
    try {
      const res = await fetch(`${API_BASE}/placement/${placementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { alert('Form deleted successfully.'); loadPlacements(); } 
      else alert('Failed to delete form.');
    } catch (error) {
      console.error('Error deleting placement:', error);
    }
  };

  // --- EDIT FUNCTION ---
  const handleEdit = (placement) => {
    setFormData({
      formTitle: placement.formTitle,
      description: placement.description || '',
      expiryDate: placement.expiryDate ? new Date(placement.expiryDate).toISOString().split('T')[0] : ''
    });

    setIsEditing(true);
    setEditingId(placement._id);
    setShowModal(true);
  };

  // --- VIEW APPLICANTS FUNCTION ---
  const viewApplicants = async (placement) => {
    try {
      setSelectedPlacementTitle(placement.formTitle);
      setShowApplicantsModal(true);
      const res = await fetch(`${API_BASE}/placement/applications/${placement._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedApplicants(data.applications || []);
      } else {
        setSelectedApplicants([]);
      }
    } catch (error) {
      console.error('Error loading applicants:', error);
      setSelectedApplicants([]);
    }
  };

  // --- HANDLE STATUS UPDATE ---
  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/placement/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        viewApplicants({ _id: selectedApplicants[0]?.placementForm, formTitle: selectedPlacementTitle });
        alert('✅ Status updated successfully!');
      } else {
        alert('Failed to update status.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // --- FILTER PLACEMENTS BASED ON SEARCH ---
  const filteredPlacements = placements.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return p.formTitle.toLowerCase().includes(searchLower);
  });

  // Helper to count interviews by status
  const countInterviews = (app, status) => {
    if (!app.interviews) return 0;
    return app.interviews.filter(i => i.status === status).length;
  };

  return (
    <div className="placement-page">
      <div className="placement-header">
        <div>
          <h1 className="placement-title">📋 Form Management</h1>
          <p className="placement-subtitle">Create and manage student training forms</p>
        </div>
        {/* ✅ Only show button if user is ADMIN */}
        {user?.role === 'admin' && (
          <button onClick={() => { setIsEditing(false); setEditingId(null); setFormData({ formTitle: "", description: "", expiryDate: "" }); setShowModal(true); }} className="create-btn">+ Create New Form</button>
        )}
      </div>

      {/* --- SEARCH BAR --- */}
      <div>
        <input 
          type="text" 
          placeholder="Search forms by title..." 
          className="search-box" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="placement-table">
          <thead>
            <tr>
              <th>Form Title</th>
              <th>Total Students</th>
              <th>Created Date</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlacements.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                {searchTerm ? `No forms found matching "${searchTerm}"` : 'No training forms created yet.'}
              </td></tr>
            ) : (
              filteredPlacements.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.formTitle}</strong></td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.applicationCount || 0}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span style={{ color: p.isActive ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => viewApplicants(p)} style={{ background: '#f3f4f6', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>👁️ View Students</button>
                    <button onClick={() => handleShare(p)} style={{ background: '#ebf8ff', color: '#2b6cb0', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>📤 Share</button>
                    <button onClick={() => handleToggleActive(p)} style={{ background: p.isActive ? '#fefcbf' : '#c6f6d5', color: p.isActive ? '#975a16' : '#22543d', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                      {p.isActive ? '⛔ Deactivate' : '✅ Activate'}
                    </button>
                    <button onClick={() => handleEdit(p)} style={{ background: '#e9d8fd', color: '#44337a', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(p._id)} style={{ background: '#fed7d7', color: '#742a2a', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CREATE/EDIT MODAL (CLEAN VERSION) --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">{isEditing ? '✏️ Edit Form' : '📝 Create New Form'}</h2>
            <form onSubmit={handleSubmit}>
              
              {/* We removed all the job fields. Only Form Title remains! */}
              <div className="form-group">
                <label>Form Title *</label>
                <input 
                  name="formTitle" 
                  placeholder="e.g. Batch 2026 Training Form" 
                  value={formData.formTitle} 
                  onChange={handleChange} 
                  required 
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Description (Optional)</label>
                <textarea 
                  rows="3" 
                  name="description" 
                  placeholder="Enter details about this training batch..." 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  name="expiryDate" 
                  value={formData.expiryDate} 
                  onChange={handleChange} 
                  className="form-control"
                />
              </div>
              
              <div className="modal-actions" style={{ marginTop: '25px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update Form' : 'Create Form')}
                </button>
              </div>
            </form>

            {createdLink && !isEditing && (
              <div className="share-box" style={{ marginTop: '20px', padding: '15px', background: '#f0fff4', border: '1px solid #48bb78', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#22543d' }}>✅ Form Created!</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2f855a' }}>Share this link with students:</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={createdLink} readOnly style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', background: 'white' }} />
                  <button onClick={() => navigator.clipboard.writeText(createdLink)} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>📋 Copy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VIEW APPLICANTS MODAL (UPDATED WITH INTERVIEW TRACKING & CSV) --- */}
      {showApplicantsModal && (
        <div className="modal-applicants-overlay" onClick={() => setShowApplicantsModal(false)}>
          <div className="modal-applicants-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px' }}>
            <div className="modal-applicants-header">
              <h3>📋 Students Applied to <span>{selectedPlacementTitle}</span></h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* 🆕 CSV DOWNLOAD BUTTON */}
                <button 
                  onClick={() => {
                    if (selectedApplicants.length === 0) return alert('No data to export');
                    
                    const headers = ['Name','Email','Phone','ID','Branch','CGPA','Batch','Course','Total Fees','Paid','Pending','Due','Joined','Ended','Total Interviews','Shortlisted','Selected','Rejected','Status'];
                    
                    const rows = selectedApplicants.map(app => [
                      `"${app.studentName}"`, `"${app.studentEmail}"`, `"${app.studentPhone || ''}"`,
                      `"${app.studentId || ''}"`, `"${app.branch}"`, app.cgpa,
                      `"${app.batchName || ''}"`, `"${app.courseType || 'Silver'}"`,
                      app.totalFees || 0, app.feesPaid || 0, app.feesPending || 0,
                      app.dueClear ? 'Clear' : 'Due',
                      `"${app.joinedDate ? new Date(app.joinedDate).toLocaleDateString() : ''}"`,
                      `"${app.endedDate ? new Date(app.endedDate).toLocaleDateString() : ''}"`,
                      app.interviews?.length || 0,
                      countInterviews(app, 'shortlisted'),
                      countInterviews(app, 'selected'),
                      countInterviews(app, 'rejected'),
                      `"${app.status || 'pending'}"`
                    ]);

                    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedPlacementTitle}_Students.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  📥 Download CSV
                </button>

                <button className="modal-applicants-close" onClick={() => setShowApplicantsModal(false)}>✕</button>
              </div>
            </div>
            <div className="modal-applicants-body">
              {selectedApplicants.length === 0 ? (
                <p className="modal-empty-state">No students have submitted this form yet.</p>
              ) : (
                <table className="modal-applicants-table">
                                    <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>ID</th>
                      <th>Branch</th>
                      <th>CGPA</th>
                      <th>Batch</th>
                      <th>Course</th>
                      <th>Total Fees</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Due Status</th>
                      <th>Joined</th>
                      <th>Ended</th>
                      <th>Interviews</th>
                      <th>Shortlisted</th>
                      <th>Selected</th>
                      <th>Rejected</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th> {/* 🆕 NEW COLUMN */}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedApplicants.map((app, index) => (
                      <tr key={app._id}>
                        <td style={{ color: '#6b7280', textAlign: 'center' }}>{index + 1}</td>
                        <td className="student-name">{app.studentName}</td>
                        <td className="student-email">{app.studentEmail}</td>
                        <td>{app.studentPhone || '-'}</td>
                        <td>{app.studentId || '-'}</td>
                        <td><span className="branch-pill">{app.branch}</span></td>
                        <td style={{ fontWeight: '500', textAlign: 'center' }}>{app.cgpa}</td>
                        <td style={{ textAlign: 'center' }}>{app.batchName || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`course-pill ${(app.courseType || 'silver').toLowerCase()}`}>
                            {app.courseType || 'Silver'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>₹{app.totalFees || 0}</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>₹{app.feesPaid || 0}</td>
                        <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>₹{app.feesPending || 0}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            background: app.dueClear ? '#d1fae5' : '#fee2e2', 
                            color: app.dueClear ? '#065f46' : '#991b1b', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '600' 
                          }}>
                            {app.dueClear ? '✅ Clear' : '⚠️ Due'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{app.joinedDate ? new Date(app.joinedDate).toLocaleDateString() : '-'}</td>
                        <td style={{ textAlign: 'center' }}>{app.endedDate ? new Date(app.endedDate).toLocaleDateString() : '-'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{app.interviews?.length || 0}</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{countInterviews(app, 'shortlisted')}</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{countInterviews(app, 'selected')}</td>
                        <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{countInterviews(app, 'rejected')}</td>
                        <td>
                          <select 
                            value={app.status} 
                            onChange={(e) => handleStatusUpdate(app._id, e.target.value)} 
                            className="status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview_scheduled">Interview</option>
                            <option value="selected">Selected</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        
                        {/* 🆕 SINGLE STUDENT CSV DOWNLOAD BUTTON */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              const headers = ['Name','Email','Phone','ID','Branch','CGPA','Batch','Course','Total Fees','Paid','Pending','Due','Joined','Ended','Total Interviews','Shortlisted','Selected','Rejected','Status'];
                              const row = [
                                `"${app.studentName}"`, `"${app.studentEmail}"`, `"${app.studentPhone || ''}"`,
                                `"${app.studentId || ''}"`, `"${app.branch}"`, app.cgpa,
                                `"${app.batchName || ''}"`, `"${app.courseType || 'Silver'}"`,
                                app.totalFees || 0, app.feesPaid || 0, app.feesPending || 0,
                                app.dueClear ? 'Clear' : 'Due',
                                `"${app.joinedDate ? new Date(app.joinedDate).toLocaleDateString() : ''}"`,
                                `"${app.endedDate ? new Date(app.endedDate).toLocaleDateString() : ''}"`,
                                app.interviews?.length || 0,
                                countInterviews(app, 'shortlisted'),
                                countInterviews(app, 'selected'),
                                countInterviews(app, 'rejected'),
                                `"${app.status || 'pending'}"`
                              ];
                              const csvContent = [headers, row].map(row => row.join(',')).join('\n');
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${app.studentName}_Record.csv`;
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Placement;