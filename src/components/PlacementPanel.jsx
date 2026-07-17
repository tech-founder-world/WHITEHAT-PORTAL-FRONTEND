// src/components/PlacementPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/PlacementPanel.css';

const API_BASE = 'http://localhost:5000/api';

export default function PlacementPanel() {
  const { user, token } = useAuth(); // ✅ Get token from AuthContext
  const [placements, setPlacements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [formData, setFormData] = useState({
    formTitle: '',
    companyName: '',
    jobRole: '',
    jobLocation: '',
    salaryPackage: '',
    description: '',
    eligibilityCriteria: '',
    expiryDate: ''
  });

  // Load placements on mount
  useEffect(() => {
    if (token) {
      loadPlacements();
    }
  }, [token]);

  const loadPlacements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/placement/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          return;
        }
        throw new Error('Failed to load placements');
      }
      
      const data = await response.json();
      setPlacements(data);
    } catch (error) {
      console.error('Error loading placements:', error);
      alert('Failed to load placements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlacement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/placement/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          return;
        }
        throw new Error('Failed to create placement');
      }

      const data = await response.json();
      
      // Copy shareable link to clipboard
      await navigator.clipboard.writeText(data.shareableLink);
      alert(`✅ Placement created successfully!\n\nShareable link copied to clipboard!\n\n${data.shareableLink}`);

      // Reset form and close modal
      setFormData({
        formTitle: '',
        companyName: '',
        jobRole: '',
        jobLocation: '',
        salaryPackage: '',
        description: '',
        eligibilityCriteria: '',
        expiryDate: ''
      });
      setShowCreateForm(false);
      loadPlacements();
    } catch (error) {
      console.error('Error creating placement:', error);
      alert('Failed to create placement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (placement) => {
    const link = `${window.location.origin}/api/placement/public/${placement.formLink}`;
    await navigator.clipboard.writeText(link);
    alert(`✅ Shareable link copied to clipboard!\n\n${link}`);
  };

  const handleDelete = async (placementId) => {
    if (!confirm('Are you sure you want to delete this placement and all its applications?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/placement/${placementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete placement');

      alert('✅ Placement deleted successfully!');
      loadPlacements();
    } catch (error) {
      console.error('Error deleting placement:', error);
      alert('Failed to delete placement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplications = async (placement) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/placement/applications/${placement._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load applications');

      const data = await response.json();
      setSelectedPlacement(placement);
      setApplications(data);
      setShowApplications(true);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/placement/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh applications
      handleViewApplications(selectedPlacement);
      alert('✅ Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'status-pending',
      shortlisted: 'status-shortlisted',
      selected: 'status-selected',
      rejected: 'status-rejected',
      interview_scheduled: 'status-interview'
    };
    return `status-badge ${statusMap[status] || 'status-pending'}`;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="placement-panel">
      {/* Header */}
      <div className="placement-header">
        <h2>💼 Placement Forms</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Create New Form
        </button>
      </div>

      {/* Loading state */}
      {loading && <div className="loading-spinner">Loading...</div>}

      {/* Placements Grid */}
      {!showApplications ? (
        <div className="placement-grid">
          {placements.length === 0 ? (
            <div className="no-placements">
              <p>No placement forms created yet.</p>
              <p>Click "Create New Form" to get started.</p>
            </div>
          ) : (
            placements.map((placement) => (
              <div key={placement._id} className="placement-card">
                <div className="placement-card-header">
                  <h3 className="company-name">{placement.companyName}</h3>
                  <span className={`badge ${placement.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {placement.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="job-role">{placement.jobRole}</div>
                {placement.jobLocation && (
                  <div className="job-location">📍 {placement.jobLocation}</div>
                )}
                {placement.salaryPackage && (
                  <div className="salary-package">💰 {placement.salaryPackage}</div>
                )}
                <div className="meta-info">
                  <span>📅 Created: {formatDate(placement.createdAt)}</span>
                </div>
                <div className="application-count">
                  📋 {placement.applicationCount || 0} applications
                </div>
                <div className="placement-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleShare(placement)}
                  >
                    📤 Share
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleViewApplications(placement)}
                  >
                    👁️ View
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(placement._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Applications View
        <div className="applications-view">
          <div className="applications-header">
            <h3>📋 Applications for {selectedPlacement?.companyName} - {selectedPlacement?.jobRole}</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setShowApplications(false);
                setSelectedPlacement(null);
                setApplications([]);
              }}
            >
              ← Back to Placements
            </button>
          </div>
          
          {applications.totalApplications === 0 ? (
            <p className="no-applications">No applications yet.</p>
          ) : (
            <div className="applications-table-container">
              <p className="total-applications">Total: {applications.totalApplications} applications</p>
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.applications?.map((app, index) => (
                    <tr key={app._id}>
                      <td>{index + 1}</td>
                      <td>{app.studentName}</td>
                      <td>{app.studentEmail}</td>
                      <td>{app.branch}</td>
                      <td>{app.cgpa}</td>
                      <td>
                        <span className={getStatusBadge(app.status)}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Placement Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Placement Form</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePlacement}>
              <div className="form-group">
                <label>Form Title *</label>
                <input
                  type="text"
                  required
                  value={formData.formTitle}
                  onChange={(e) => setFormData({...formData, formTitle: e.target.value})}
                  placeholder="e.g., Software Engineer Internship 2026"
                />
              </div>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder="e.g., Google"
                />
              </div>
              <div className="form-group">
                <label>Job Role *</label>
                <input
                  type="text"
                  required
                  value={formData.jobRole}
                  onChange={(e) => setFormData({...formData, jobRole: e.target.value})}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="form-group">
                <label>Job Location</label>
                <input
                  type="text"
                  value={formData.jobLocation}
                  onChange={(e) => setFormData({...formData, jobLocation: e.target.value})}
                  placeholder="e.g., Bangalore, Remote"
                />
              </div>
              <div className="form-group">
                <label>Salary Package</label>
                <input
                  type="text"
                  value={formData.salaryPackage}
                  onChange={(e) => setFormData({...formData, salaryPackage: e.target.value})}
                  placeholder="e.g., ₹20 LPA"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the role, responsibilities, and requirements"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Eligibility Criteria</label>
                <textarea
                  value={formData.eligibilityCriteria}
                  onChange={(e) => setFormData({...formData, eligibilityCriteria: e.target.value})}
                  placeholder="e.g., BE/B.Tech with 7.5+ CGPA, No backlogs"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}