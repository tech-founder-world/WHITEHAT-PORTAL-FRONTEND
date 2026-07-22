import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Placement.css';

const API_BASE = 'http://localhost:5000/api';

function Placement() {
  const { token, user } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState(''); 
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // View Applicants Modal
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [applicants, setApplicants] = useState([]);

  // Interview Detail Modal
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  const handleShare = async (placement) => {
    const fullLink = `${window.location.origin}/apply/${placement.formLink.replace('placement/', '')}`;
    try {
      await navigator.clipboard.writeText(fullLink);
      alert(`✅ Link copied to clipboard!\n\n${fullLink}`);
    } catch (err) {
      alert("Failed to copy link. Please copy it manually.");
    }
  };

  const handleToggleActive = async (placement) => {
    const newStatus = !placement.isActive;
    if(!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this form?`)) return;
    try {
      const res = await fetch(`${API_BASE}/placement/${placement._id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) loadPlacements();
      else alert('Failed to update status.');
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

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

  const viewApplicants = async (placement) => {
    try {
      setSelectedPlacement(placement);
      const res = await fetch(`${API_BASE}/placement/applications/placement/${placement._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
        setShowApplicantsModal(true);
      }
    } catch (error) {
      console.error('Error loading applicants:', error);
      alert('Error loading applicants');
    }
  };

  const viewStudentDetails = async (student) => {
    try {
      const res = await fetch(`${API_BASE}/placement/applications/${student._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedStudent(data);
        setShowInterviewModal(true);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const filteredPlacements = placements.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return p.formTitle.toLowerCase().includes(searchLower);
  });

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

  return (
    <div className="placement-page">
      <div className="placement-header">
        <div>
          <h1 className="placement-title">📋 Placement Forms</h1>
          <p className="placement-subtitle">Create and manage student placement forms</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => { setIsEditing(false); setEditingId(null); setFormData({ formTitle: "", description: "", expiryDate: "" }); setShowModal(true); }} className="create-btn">+ Create New Form</button>
        )}
      </div>

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlacements.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                {searchTerm ? `No forms found matching "${searchTerm}"` : 'No placement forms created yet.'}
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
                  <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => viewApplicants(p)} className="btn-view">👁️ View Students</button>
                    <button onClick={() => handleShare(p)} className="btn-share">📤 Share</button>
                    <button onClick={() => handleToggleActive(p)} className={p.isActive ? 'btn-deactivate' : 'btn-activate'}>
                      {p.isActive ? '⛔ Deactivate' : '✅ Activate'}
                    </button>
                    <button onClick={() => handleEdit(p)} className="btn-edit">✏️ Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="btn-delete">🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">{isEditing ? '✏️ Edit Form' : '📝 Create New Form'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Form Title *</label>
                <input name="formTitle" placeholder="e.g. Batch 2026 Placement Form" value={formData.formTitle} onChange={handleChange} required className="form-control" />
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Description (Optional)</label>
                <textarea rows="3" name="description" placeholder="Enter details about this placement..." value={formData.description} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Expiry Date (Optional)</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="form-control" />
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

      {/* View Applicants Modal */}
      {showApplicantsModal && selectedPlacement && (
        <div className="modal-overlay" onClick={() => setShowApplicantsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1400px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Students Applied to <span style={{ color: '#f97316' }}>"{selectedPlacement.formTitle}"</span></h3>
              <button className="modal-close" onClick={() => setShowApplicantsModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflow: 'auto' }}>
              {applicants.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>No students have applied yet.</p>
              ) : (
                <table className="applicants-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Father's Name</th>
                      <th>Course</th>
                      <th>Timing</th>
                      <th>Total Fees</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Interviews</th>
                      <th>Selected</th>
                      <th>Rejected</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app, index) => (
                      <tr key={app._id} onClick={() => viewStudentDetails(app)} style={{ cursor: 'pointer' }}>
                        <td>{index + 1}</td>
                        <td><strong>{app.studentName}</strong></td>
                        <td>{app.studentEmail}</td>
                        <td>{app.studentPhone}</td>
                        <td>{app.fatherName || 'N/A'}</td>
                        <td>
                          <span className={`course-pill ${app.courseType?.toLowerCase() || 'silver'}`}>
                            {app.courseType || 'Silver'}
                          </span>
                        </td>
                        <td>{app.courseTiming || 'N/A'}</td>
                        <td>₹{app.totalFees || 0}</td>
                        <td style={{ color: '#16a34a' }}>₹{app.feesPaid || 0}</td>
                        <td style={{ color: (app.feesPending || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                          ₹{app.feesPending || 0}
                        </td>
                        <td>{app.totalInterviewsGiven || 0}</td>
                        <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{app.totalInterviewsSelected || 0}</td>
                        <td style={{ color: '#dc2626' }}>{app.totalInterviewsRejected || 0}</td>
                        <td>
                          <span style={{ 
                            background: getStatusBadge(app.status).background, 
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-block'
                          }}>
                            {app.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={(e) => { e.stopPropagation(); viewStudentDetails(app); }}
                            style={{ background: '#e9d8fd', color: '#44337a', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            📊 Details
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

      {/* Student Details & Interview Modal */}
      {showInterviewModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📊 Student Details: <span style={{ color: '#f97316' }}>{selectedStudent.studentName}</span></h3>
              <button className="modal-close" onClick={() => setShowInterviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div><strong>Email:</strong> {selectedStudent.studentEmail}</div>
                <div><strong>Phone:</strong> {selectedStudent.studentPhone}</div>
                <div><strong>Father's Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                <div><strong>Course:</strong> {selectedStudent.courseType}</div>
                <div><strong>Timing:</strong> {selectedStudent.courseTiming || 'N/A'}</div>
                <div><strong>Branch:</strong> {selectedStudent.branch || 'N/A'}</div>
                <div><strong>Total Fees:</strong> ₹{selectedStudent.totalFees || 0}</div>
                <div><strong>Fees Paid:</strong> ₹{selectedStudent.feesPaid || 0}</div>
                <div><strong>Fees Pending:</strong> ₹{selectedStudent.feesPending || 0}</div>
                <div><strong>Joined:</strong> {selectedStudent.joinedDate ? new Date(selectedStudent.joinedDate).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Ended:</strong> {selectedStudent.endedDate ? new Date(selectedStudent.endedDate).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Resume:</strong> {selectedStudent.resumeLink ? <a href={selectedStudent.resumeLink} target="_blank" rel="noopener noreferrer">View Resume</a> : 'N/A'}</div>
              </div>

              <h4 style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>Interview History</h4>
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

export default Placement;