// src/components/StudentPlacementForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

export default function StudentPlacementForm() {
  const { formLink } = useParams(); // Gets the unique ID from the URL (e.g., abc123)
  const [placement, setPlacement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Student Application Data (Hidden fields added to pass backend validation)
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    branch: '',
    year: '',
    
    // ✅ HIDDEN FIELDS (Added to satisfy backend, but never shown to student)
    studentId: 'N/A',
    semester: 'N/A',
    cgpa: 0,

    // New Training Fields
    courseType: 'Silver',
    fees: '',
    batchTiming: '',

    skills: '',
    experience: '',
    resumeLink: ''
  });

  // 1. Fetch placement details when the page loads
  useEffect(() => {
    const fetchPlacement = async () => {
      try {
        const res = await fetch(`${API_BASE}/placement/public/${formLink}`);
        if (res.ok) {
          const data = await res.json();
          setPlacement(data);
        } else {
          setMessage({ type: 'error', text: 'Form not found or has expired.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error loading form details.' });
      } finally {
        setLoading(false);
      }
    };
    fetchPlacement();
  }, [formLink]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Submit application to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/placement/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, placementId: placement.placementId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      setMessage({ type: 'success', text: '✅ Registration submitted successfully!' });
      
      // Clear form (keep hidden fields intact)
      setFormData({
        studentName: '', studentEmail: '', studentPhone: '',
        branch: '', year: '',
        studentId: 'N/A', semester: 'N/A', cgpa: 0,
        courseType: 'Silver', fees: '', batchTiming: '',
        skills: '', experience: '', resumeLink: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // --- LOADING STATE ---
  if (loading) return <div style={{padding: '40px', textAlign: 'center', fontFamily: 'sans-serif'}}>Loading Form...</div>;
  
  // --- ERROR STATE ---
  if (message && message.type === 'error' && !placement) return <div style={{padding: '40px', textAlign: 'center', color: '#dc2626', fontFamily: 'sans-serif'}}>{message.text}</div>;

  // --- RENDER FORM ---
  return (
    <div style={{maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif'}}>
      
      {/* Placement Details Header */}
      <div style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px'}}>
        <h1 style={{margin: '0 0 5px 0', color: '#1f2937'}}>{placement?.formTitle}</h1>
        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', color: '#6b7280', fontSize: '15px'}}>
          <span>📅 Apply by: {placement?.expiryDate ? new Date(placement.expiryDate).toLocaleDateString() : 'Open'}</span>
        </div>
        <div style={{marginTop: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px'}}>
          <p style={{margin: '0 0 10px 0'}}><strong>Description:</strong><br/>{placement?.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Student Application Form */}
      <div style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <h2 style={{marginTop: 0, color: '#1f2937'}}>📝 Register for Batch</h2>
        <form onSubmit={handleSubmit}>
          
          {/* --- PERSONAL INFO GRID --- */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Full Name *</label>
              <input type="text" name="studentName" required value={formData.studentName} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Email *</label>
              <input type="email" name="studentEmail" required value={formData.studentEmail} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Phone *</label>
              <input type="tel" name="studentPhone" required value={formData.studentPhone} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Branch *</label>
              <input type="text" name="branch" required value={formData.branch} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Current Year *</label>
              <input type="text" name="year" required value={formData.year} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
          </div>

          {/* --- NEW TRAINING FIELDS SECTION --- */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1f2937' }}>Training Details</h3>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              
              {/* Batch Type (Dropdown) */}
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Batch Type *</label>
                <select name="courseType" required value={formData.courseType} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px', background: 'white'}}>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              {/* Fees Structure (Number) */}
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Fees Structure (₹) *</label>
                <input type="number" name="fees" required min="0" placeholder="e.g. 25000" value={formData.fees} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
              </div>

              {/* Batch Timing */}
              <div style={{display: 'flex', flexDirection: 'column', gridColumn: '1 / -1'}}>
                <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Batch Timing</label>
                <input type="text" name="batchTiming" placeholder="e.g. Monday - Friday, 6 PM to 8 PM" value={formData.batchTiming} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
              </div>

            </div>
          </div>

          {/* --- EXTRAS SECTION --- */}
          <div style={{marginTop: '20px'}}>
            <div style={{display: 'flex', flexDirection: 'column', marginTop: '15px'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Skills (Comma separated)</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} placeholder="e.g., React, Python, Java" />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', marginTop: '15px'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Resume / Portfolio Link</label>
              <input type="url" name="resumeLink" value={formData.resumeLink} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} placeholder="e.g., Google Drive link" />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', marginTop: '15px'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Previous Experience</label>
              <textarea name="experience" rows="2" value={formData.experience} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical'}} placeholder="Any relevant work experience..."></textarea>
            </div>
          </div>

          {message && (
            <div style={{marginTop: '15px', padding: '12px', borderRadius: '6px', background: message.type === 'success' ? '#f0fff4' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: message.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5'}}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={submitting} style={{width: '100%', marginTop: '20px', padding: '14px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', transition: '0.2s'}} onMouseEnter={(e) => e.target.style.background = '#ea580c'} onMouseLeave={(e) => e.target.style.background = '#f97316'}>
            {submitting ? 'Submitting...' : '🚀 Register Now'}
          </button>
        </form>
      </div>
    </div>
  );
}