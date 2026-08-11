import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/applications.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faSave, faTimes, faFileUpload, faUpload, faEnvelopeOpen } from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function CreateApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicationDate: new Date().toISOString().split('T')[0],
    studentId: '',
    countryId: '',
    universityId: '',
    intakeId: '',
    program: '',
    appsSubmittedThrough: '',
    appsTaggedThrough: '',
    universityFees: '',
    withdrawn: 'No',
    condition: '',
    firm: '',
    insurance: '',
    finalChoice: '',
    depositPaid: 'No',
    applicationStatus: 'Pending',
    taggingStatus: 'Not Received',
    remarks: ''
  });

  const [students, setStudents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [intakes, setIntakes] = useState([]);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('manual'); // 'manual' | 'offer'
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [createdApplicationId, setCreatedApplicationId] = useState(null);

  useEffect(() => { fetchStudents(); fetchCountries(); }, []);

  useEffect(() => {
    if (formData.countryId) fetchUniversitiesByCountry(formData.countryId);
    else { setUniversities([]); setFormData(prev => ({ ...prev, universityId: '', intakeId: '' })); }
  }, [formData.countryId]);

  useEffect(() => {
    if (formData.universityId) fetchIntakesByUniversity(formData.universityId);
    else { setIntakes([]); setFormData(prev => ({ ...prev, intakeId: '' })); }
  }, [formData.universityId]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/students`);
      const data = await res.json();
      if (data.success) setStudents(data.students);
    } catch (e) { console.error(e); }
  };

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      if (data.success) setCountries(data.countries.filter(c => c.status === 'Active'));
    } catch (e) { console.error(e); }
  };

  const fetchUniversitiesByCountry = async (countryId) => {
    try {
      const res = await fetch(`${API_URL}/universities/by-country/${countryId}`);
      const data = await res.json();
      if (data.success) setUniversities(data.universities.filter(u => u.status === 'Active'));
    } catch (e) { setUniversities([]); }
  };

  const fetchIntakesByUniversity = async (universityId) => {
    try {
      const res = await fetch(`${API_URL}/intakes/by-university/${universityId}`);
      const data = await res.json();
      if (data.success) setIntakes(data.intakes.filter(i => i.status === 'Active'));
    } catch (e) { setIntakes([]); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.countryId || !formData.universityId || !formData.intakeId || !formData.program) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setCreatedApplicationId(data.applicationId);
        alert(`Application created successfully! Application ID: ${data.generatedApplicationId}`);
        setShowUploadModal(true);
      } else {
        alert(data.message || 'Failed to create application');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openUpload = (type) => {
    setUploadType(type);
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { alert('Please select a file'); return; }
    if (!createdApplicationId) { alert('No application ID found.'); return; }

    setUploadingFile(true);
    try {
      const fd = new FormData();
      const endpoint = uploadType === 'manual'
        ? `${API_URL}/applications/${createdApplicationId}/manual-form`
        : `${API_URL}/applications/${createdApplicationId}/offer-letter`;
      const fieldName = uploadType === 'manual' ? 'manualForm' : 'offerLetter';
      fd.append(fieldName, selectedFile);

      const response = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await response.json();

      if (data.success) {
        alert(`${uploadType === 'manual' ? 'Manual form' : 'Offer letter'} uploaded successfully`);
        setShowUploadModal(false);
        setSelectedFile(null);
        navigate('/applications');
      } else {
        alert(data.message || 'Failed to upload file');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="form-container counselors-container">
          <div className="form-header">
            <h1>
              <FontAwesomeIcon icon={faFileAlt} className="page-icon" />
              Create New Application
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="counselor-form">
            {/* Basic Information */}
            <div className="form-section">
              <h2 className="section-title">Basic Information</h2>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Application Date <span className="required">*</span></label>
                  <input type="date" className="input-field" name="applicationDate" value={formData.applicationDate} onChange={handleChange} required />
                </div>
                <div className="col-md-8 mb-3">
                  <label className="form-label">Student <span className="required">*</span></label>
                  <select className="input-field" name="studentId" value={formData.studentId} onChange={handleChange} required>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.student_id} - {s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Country <span className="required">*</span></label>
                  <select className="input-field" name="countryId" value={formData.countryId} onChange={handleChange} required>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.country_name}</option>)}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">University <span className="required">*</span></label>
                  <select className="input-field" name="universityId" value={formData.universityId} onChange={handleChange} required disabled={!formData.countryId}>
                    <option value="">Select University</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.university_name}</option>)}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Intake <span className="required">*</span></label>
                  <select className="input-field" name="intakeId" value={formData.intakeId} onChange={handleChange} required disabled={!formData.universityId}>
                    <option value="">Select Intake</option>
                    {intakes.map(i => <option key={i.id} value={i.id}>{i.intake_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Program <span className="required">*</span></label>
                  <input type="text" className="input-field" name="program" value={formData.program} onChange={handleChange} placeholder="Enter program name" required />
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="form-section">
              <h2 className="section-title">Application Details</h2>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Apps Submitted Through</label>
                  <input type="text" className="input-field" name="appsSubmittedThrough" value={formData.appsSubmittedThrough} onChange={handleChange} placeholder="Enter submission method" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Apps Tagged Through</label>
                  <input type="text" className="input-field" name="appsTaggedThrough" value={formData.appsTaggedThrough} onChange={handleChange} placeholder="Enter tagging method" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">University Fees</label>
                  <input type="number" step="0.01" className="input-field" name="universityFees" value={formData.universityFees} onChange={handleChange} placeholder="Enter fees amount" />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Application Status</label>
                  <select className="input-field" name="applicationStatus" value={formData.applicationStatus} onChange={handleChange}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Tagging Status</label>
                  <select className="input-field" name="taggingStatus" value={formData.taggingStatus} onChange={handleChange}>
                    <option value="Not Received">Not Received</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Deposit Paid</label>
                  <select className="input-field" name="depositPaid" value={formData.depositPaid} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Firm</label>
                  <input type="text" className="input-field" name="firm" value={formData.firm} onChange={handleChange} placeholder="Enter firm details" />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Insurance</label>
                  <input type="text" className="input-field" name="insurance" value={formData.insurance} onChange={handleChange} placeholder="Enter insurance details" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Final Choice</label>
                  <input type="text" className="input-field" name="finalChoice" value={formData.finalChoice} onChange={handleChange} placeholder="Enter final choice" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Condition</label>
                  <textarea className="input-field" name="condition" value={formData.condition} onChange={handleChange} rows="3" placeholder="Enter any conditions" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea className="input-field" name="remarks" value={formData.remarks} onChange={handleChange} rows="3" placeholder="Enter any remarks or notes" />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/applications')} disabled={loading}>
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                <FontAwesomeIcon icon={faSave} /> {loading ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Upload Modal — shows after creation with choice of Manual Form or Offer Letter */}
      {showUploadModal && (
        <>
          <div className="modal-backdrop show" onClick={() => !uploadingFile && setShowUploadModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faFileUpload} style={{ marginRight: '10px' }} />
                    Upload Documents
                  </h5>
                  <button type="button" className="btn-close-modal" onClick={() => setShowUploadModal(false)} disabled={uploadingFile}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <form onSubmit={handleFileUpload}>
                  <div className="modal-body">
                    {/* Toggle buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <button
                        type="button"
                        onClick={() => setUploadType('manual')}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                          border: uploadType === 'manual' ? '2px solid #F47B20' : '2px solid #e5e7eb',
                          background: uploadType === 'manual' ? '#fff7ed' : '#f9fafb',
                          color: uploadType === 'manual' ? '#F47B20' : '#6b7280',
                        }}
                      >
                        <FontAwesomeIcon icon={faFileUpload} style={{ marginRight: '6px' }} />
                        Manual Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadType('offer')}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                          border: uploadType === 'offer' ? '2px solid #F47B20' : '2px solid #e5e7eb',
                          background: uploadType === 'offer' ? '#fff7ed' : '#f9fafb',
                          color: uploadType === 'offer' ? '#F47B20' : '#6b7280',
                        }}
                      >
                        <FontAwesomeIcon icon={faEnvelopeOpen} style={{ marginRight: '6px' }} />
                        Offer Letter
                      </button>
                    </div>

                    <div className="modal-form-group">
                      <label>
                        Select {uploadType === 'manual' ? 'Manual Form' : 'Offer Letter'} <span className="required">*</span>
                      </label>
                      <input
                        type="file"
                        className="input-field"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        required
                      />
                      <small style={{ display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => { setShowUploadModal(false); navigate('/applications'); }} disabled={uploadingFile}>
                      Skip
                    </button>
                    <button type="submit" className="btn-primary" disabled={uploadingFile}>
                      <FontAwesomeIcon icon={faUpload} />
                      {uploadingFile ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}