// src/components/Placement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Placement.css';

const API_BASE = 'http://localhost:5000/api';

function Placement() {
  const { token } = useAuth();
  
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

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    formTitle: "", companyName: "", jobRole: "", jobLocation: "", 
    salaryPackage: "", eligibilityCriteria: "", expiryDate: "", description: ""
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
    if (name === 'companyName') {
      setFormData((prev) => ({ ...prev, [name]: value, formTitle: `${value} Placement Drive` }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
        alert('✅ Placement updated successfully!');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({ formTitle: "", companyName: "", jobRole: "", jobLocation: "", salaryPackage: "", eligibilityCriteria: "", expiryDate: "", description: "" });
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
    if(!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this placement?`)) return;
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
    if (!confirm("Are you sure you want to DELETE this placement and all its applications? This cannot be undone!")) return;
    try {
      const res = await fetch(`${API_BASE}/placement/${placementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { alert('Placement deleted successfully.'); loadPlacements(); } 
      else alert('Failed to delete placement.');
    } catch (error) {
      console.error('Error deleting placement:', error);
    }
  };

  // --- EDIT FUNCTION ---
  const handleEdit = (placement) => {
    setFormData({
      formTitle: placement.formTitle,
      companyName: placement.companyName,
      jobRole: placement.jobRole,
      jobLocation: placement.jobLocation || '',
      salaryPackage: placement.salaryPackage || '',
      eligibilityCriteria: placement.eligibilityCriteria || '',
      expiryDate: placement.expiryDate ? new Date(placement.expiryDate).toISOString().split('T')[0] : '',
      description: placement.description || ''
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

  // --- FILTER PLACEMENTS BASED ON SEARCH ---
  const filteredPlacements = placements.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.companyName.toLowerCase().includes(searchLower) ||
      p.jobRole.toLowerCase().includes(searchLower) ||
      p.formTitle.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="placement-page">
      <div className="placement-header">
        <div>
          <h1 className="placement-title">Placement Management</h1>
          <p className="placement-subtitle">Manage Placement Drives</p>
        </div>
        <button onClick={() => { setIsEditing(false); setEditingId(null); setFormData({ formTitle: "", companyName: "", jobRole: "", jobLocation: "", salaryPackage: "", eligibilityCriteria: "", expiryDate: "", description: "" }); setShowModal(true); }} className="create-btn">+ Create Placement</button>
      </div>

      {/* --- SEARCH BAR --- */}
      <div>
        <input 
          type="text" 
          placeholder="Search Placement..." 
          className="search-box" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="placement-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Deadline</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlacements.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                {searchTerm ? `No placements found matching "${searchTerm}"` : 'No Placement Drives Found'}
              </td></tr>
            ) : (
              filteredPlacements.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.companyName}</strong></td>
                  <td>{p.jobRole}</td>
                  <td>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span style={{ color: p.isActive ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => viewApplicants(p)} style={{ background: '#f3f4f6', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>👁️ View ({p.applicationCount || 0})</button>
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

      {/* --- CREATE/EDIT MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{isEditing ? '✏️ Edit Placement Drive' : '📝 Create Placement Drive'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <input name="companyName" placeholder="Company Name *" value={formData.companyName} onChange={handleChange} required />
                <input name="jobRole" placeholder="Job Role *" value={formData.jobRole} onChange={handleChange} required />
                <input name="jobLocation" placeholder="Job Location" value={formData.jobLocation} onChange={handleChange} />
                <input name="salaryPackage" placeholder="Salary Package" value={formData.salaryPackage} onChange={handleChange} />
                <input name="eligibilityCriteria" placeholder="Eligibility Criteria" value={formData.eligibilityCriteria} onChange={handleChange} />
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
              </div>
              <textarea rows="4" name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update Placement' : 'Create Placement')}
                </button>
              </div>
            </form>

            {createdLink && !isEditing && (
              <div className="share-box" style={{ marginTop: '20px', padding: '15px', background: '#f0fff4', border: '1px solid #48bb78', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#22543d' }}>✅ Placement Created!</h4>
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

      {/* --- VIEW APPLICANTS MODAL --- */}
      {showApplicantsModal && (
        <div className="modal-applicants-overlay" onClick={() => setShowApplicantsModal(false)}>
          <div className="modal-applicants-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
            <div className="modal-applicants-header">
              <h3>📋 Applicants for <span>{selectedPlacementTitle}</span></h3>
              <button className="modal-applicants-close" onClick={() => setShowApplicantsModal(false)}>✕</button>
            </div>
            <div className="modal-applicants-body">
              {selectedApplicants.length === 0 ? (
                <p className="modal-empty-state">No applications have been submitted for this drive yet.</p>
              ) : (
                <table className="modal-applicants-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Student ID</th>
                      <th>Year / Sem</th><th>Branch</th><th>CGPA</th><th>Skills</th><th>Resume</th>
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
                        <td>{app.year} / {app.semester}</td>
                        <td><span className="branch-pill">{app.branch}</span></td>
                        <td style={{ fontWeight: '500', textAlign: 'center' }}>{app.cgpa}</td>
                        <td style={{ maxWidth: '120px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {app.skills && app.skills.length > 0 ? (
                              app.skills.slice(0, 3).map((skill, i) => (
                                <span key={i} style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#374151' }}>{skill}</span>
                              ))
                            ) : (<span style={{ color: '#9ca3af', fontSize: '13px' }}>-</span>)}
                            {app.skills && app.skills.length > 3 && <span style={{ fontSize: '12px', color: '#6b7280' }}>+{app.skills.length - 3}</span>}
                          </div>
                        </td>
                        <td>
                          {app.resumeLink ? (
                            <a href={app.resumeLink} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontWeight: '600', textDecoration: 'underline' }}>View</a>
                          ) : (<span style={{ color: '#9ca3af' }}>-</span>)}
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