import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

export default function StudentPlacementForm() {
  const { formLink } = useParams();
  const [placement, setPlacement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    fatherName: '',
    courseType: 'Silver',
    courseTiming: '',
    resumeLink: ''
  });

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

      setMessage({ type: 'success', text: '✅ Application submitted successfully!' });
      
      setFormData({
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        fatherName: '',
        courseType: 'Silver',
        courseTiming: '',
        resumeLink: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center', fontFamily: 'sans-serif'}}>Loading Form...</div>;
  
  if (message && message.type === 'error' && !placement) {
    return <div style={{padding: '40px', textAlign: 'center', color: '#dc2626', fontFamily: 'sans-serif'}}>{message.text}</div>;
  }

  return (
    <div style={{maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif'}}>
      
      <div style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px'}}>
        <h1 style={{margin: '0 0 5px 0', color: '#1f2937'}}>{placement?.formTitle}</h1>
        <p style={{color: '#6b7280', margin: '0'}}>{placement?.description}</p>
        {placement?.companyName && (
          <p style={{color: '#6b7280', marginTop: '10px'}}>🏢 {placement.companyName} | {placement.jobRole}</p>
        )}
      </div>

      <div style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <h2 style={{marginTop: 0, color: '#1f2937'}}>📝 Student Application</h2>
        <form onSubmit={handleSubmit}>
          
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
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Father's Name</label>
              <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Course Type *</label>
              <select name="courseType" required value={formData.courseType} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px', background: 'white'}}>
                <option value="Silver">Silver</option>
                <option value="Platinum">Platinum</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Course Timing</label>
              <input type="text" name="courseTiming" placeholder="e.g. Mon-Fri, 6PM-8PM" value={formData.courseTiming} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} />
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', marginTop: '15px'}}>
            <label style={{fontWeight: '600', fontSize: '14px', marginBottom: '5px'}}>Resume / Portfolio Link</label>
            <input type="url" name="resumeLink" value={formData.resumeLink} onChange={handleChange} style={{padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px'}} placeholder="e.g., Google Drive link" />
          </div>

          {message && (
            <div style={{marginTop: '15px', padding: '12px', borderRadius: '6px', background: message.type === 'success' ? '#f0fff4' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: message.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5'}}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={submitting} style={{width: '100%', marginTop: '20px', padding: '14px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', transition: '0.2s'}}>
            {submitting ? 'Submitting...' : '🚀 Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}