import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/applications.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { ViewModeWrap } from '../components/ViewRecordModal';
import StudentSearchSelect from '../components/StudentSearchSelect';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faSave, faTimes, faUpload, faDownload, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  APPLICATION_CHANNELS,
  APPLICATION_DOCUMENT_TYPES,
  APPLICATION_STATUS_OPTIONS,
  OFFER_LETTER_OPTIONS,
  PAID_STATUS_OPTIONS,
  TAGGING_STATUS_OPTIONS,
  TUITION_STATUS_OPTIONS,
  getIntakeOptions,
  normalizeTaggingStatus,
} from '../constants/applicationOptions';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const parseStoredOption = (value, options) => {
  if (!value) return { selected: '', other: '' };
  if (options.includes(value)) return { selected: value, other: '' };
  if (String(value).startsWith('Other:')) return { selected: 'Other', other: String(value).replace(/^Other:\s*/, '') };
  return { selected: 'Other', other: value };
};

const parseIntake = (app) => {
  const value = app.intake || '';
  if (!value && app.intake_name) return parseStoredOption(app.intake_name, getIntakeOptions());
  return parseStoredOption(value, getIntakeOptions());
};

export default function EditApplication({ recordId, viewOnly = false } = {}) {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = recordId || paramId;
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [formData, setFormData] = useState({
    applicationDate: '',
    studentId: '',
    countryId: '',
    universityId: '',
    program: '',
    intake: '',
    intakeOther: '',
    appsSubmittedThrough: '',
    appsSubmittedThroughOther: '',
    appsTaggedThrough: '',
    appsTaggedThroughOther: '',
    taggingStatus: 'Not Tagged',
    applicationStatus: 'Pending',
    offerLetterType: '',
    offerLetterOther: '',
    universityFees: '',
    initialDepositStatus: '',
    initialDepositAmount: '',
    enrollmentFeeStatus: '',
    enrollmentFeeAmount: '',
    tuitionFeeStatus: '',
    tuitionFeeAmount: '',
    condition: '',
    remarks: '',
  });

  const [students, setStudents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadingType, setUploadingType] = useState('');
  const intakeOptions = getIntakeOptions();

  useEffect(() => {
    fetchStudents();
    fetchCountries();
    fetchApplicationData();
  }, [id]);

  useEffect(() => {
    if (formData.countryId) fetchUniversitiesByCountry(formData.countryId);
  }, [formData.countryId]);

  const fetchApplicationData = async () => {
    try {
      setFetchingData(true);
      const res = await fetch(`${API_URL}/applications/${id}`);
      const data = await res.json();
      if (data.success) {
        const app = data.application;
        const intake = parseIntake(app);
        const submitted = parseStoredOption(app.apps_submitted_through, APPLICATION_CHANNELS);
        const tagged = parseStoredOption(app.apps_tagged_through, APPLICATION_CHANNELS);
        const offer = parseStoredOption(app.offer_letter_type, OFFER_LETTER_OPTIONS);
        setFormData({
          applicationDate: app.application_date ? String(app.application_date).split('T')[0] : '',
          studentId: app.student_id,
          countryId: app.country_id,
          universityId: app.university_id,
          program: app.program || '',
          intake: intake.selected,
          intakeOther: intake.other || app.intake_other || '',
          appsSubmittedThrough: submitted.selected,
          appsSubmittedThroughOther: app.apps_submitted_through_other || submitted.other,
          appsTaggedThrough: tagged.selected,
          appsTaggedThroughOther: app.apps_tagged_through_other || tagged.other,
          taggingStatus: normalizeTaggingStatus(app.tagging_status),
          applicationStatus: app.application_status || 'Pending',
          offerLetterType: offer.selected,
          offerLetterOther: app.offer_letter_other || offer.other,
          universityFees: app.university_fees || '',
          initialDepositStatus: app.initial_deposit_status || '',
          initialDepositAmount: app.initial_deposit_amount || '',
          enrollmentFeeStatus: app.enrollment_fee_status || '',
          enrollmentFeeAmount: app.enrollment_fee_amount || '',
          tuitionFeeStatus: app.tuition_fee_status || '',
          tuitionFeeAmount: app.tuition_fee_amount || '',
          condition: app.condition || '',
          remarks: app.remarks || '',
        });
        fetchDocuments();
      } else {
        alert('Application not found');
        navigate('/applications');
      }
    } catch (error) {
      alert('Failed to load application data');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/applications/${id}/documents`);
      const data = await res.json();
      if (data.success) setDocuments(data.documents || []);
    } catch (e) { console.error(e); }
  };

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
      if (data.success) setCountries(data.countries);
    } catch (e) { console.error(e); }
  };

  const fetchUniversitiesByCountry = async (countryId) => {
    try {
      const res = await fetch(`${API_URL}/universities/by-country/${countryId}`);
      const data = await res.json();
      if (data.success) setUniversities(data.universities);
    } catch (e) { setUniversities([]); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return;
    if (!formData.studentId || !formData.countryId || !formData.universityId || !formData.program) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) { alert('Application updated successfully!'); navigate('/applications'); }
      else alert(data.message || 'Failed to update application');
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return;
    setUploadingType(documentType);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('documentType', documentType);
      const res = await fetch(`${API_URL}/applications/${id}/documents`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) fetchDocuments();
      else alert(data.message || 'Failed to upload document');
    } catch (e) {
      alert('Network error. Please try again.');
    } finally {
      setUploadingType('');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res = await fetch(`${API_URL}/applications/${id}/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchDocuments();
      else alert(data.message || 'Failed to delete');
    } catch (e) { alert('Network error.'); }
  };

  const docsForType = (type) => documents.filter(d => d.document_type === type);
  const showOfferLetter = formData.applicationStatus === 'Accepted';

  if (fetchingData) {
    return (
      <ViewModeWrap viewOnly={viewOnly}>
        <Sidebar />
        <div className="main-content" id="mainContent">
          <Header />
          <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading application data...</p></div>
        </div>
      </ViewModeWrap>
    );
  }

  return (
    <ViewModeWrap viewOnly={viewOnly}>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="form-container counselors-container">
          <div className="form-header">
            <h1>
              <FontAwesomeIcon icon={faFileAlt} className="page-icon" />
              {viewOnly ? 'Application Details' : 'Edit Application'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="counselor-form">
            <div className="form-section">
              <h2 className="section-title">Application Management</h2>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Application Date <span className="required">*</span></label>
                  <input type="date" className="input-field" name="applicationDate" value={formData.applicationDate} onChange={handleChange} required />
                </div>
                <div className="col-md-8 mb-3">
                  <label className="form-label">Student <span className="required">*</span></label>
                  <StudentSearchSelect
                    students={students}
                    value={formData.studentId}
                    onChange={(studentId) => setFormData(prev => ({ ...prev, studentId }))}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Country <span className="required">*</span></label>
                  <select className="input-field" name="countryId" value={formData.countryId} onChange={handleChange} required>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.country_name}</option>)}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">University <span className="required">*</span></label>
                  <select className="input-field" name="universityId" value={formData.universityId} onChange={handleChange} required disabled={!formData.countryId}>
                    <option value="">Select University</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.university_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Program <span className="required">*</span></label>
                  <input type="text" className="input-field" name="program" value={formData.program} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Intake</label>
                  <select className="input-field" name="intake" value={formData.intake} onChange={handleChange}>
                    <option value="">Select Intake</option>
                    {intakeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    {formData.intake && !intakeOptions.includes(formData.intake) && (
                      <option value={formData.intake}>{formData.intake}</option>
                    )}
                  </select>
                </div>
                {formData.intake === 'Other' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Other Intake</label>
                    <input type="text" className="input-field" name="intakeOther" value={formData.intakeOther} onChange={handleChange} />
                  </div>
                )}
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Application Submitted Through</label>
                  <select className="input-field" name="appsSubmittedThrough" value={formData.appsSubmittedThrough} onChange={handleChange}>
                    <option value="">Select</option>
                    {APPLICATION_CHANNELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.appsSubmittedThrough === 'Other' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Other Submitted Through</label>
                    <input type="text" className="input-field" name="appsSubmittedThroughOther" value={formData.appsSubmittedThroughOther} onChange={handleChange} />
                  </div>
                )}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Application Tagged Through</label>
                  <select className="input-field" name="appsTaggedThrough" value={formData.appsTaggedThrough} onChange={handleChange}>
                    <option value="">Select</option>
                    {APPLICATION_CHANNELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.appsTaggedThrough === 'Other' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Other Tagged Through</label>
                    <input type="text" className="input-field" name="appsTaggedThroughOther" value={formData.appsTaggedThroughOther} onChange={handleChange} />
                  </div>
                )}
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Tagging Status</label>
                  <select className="input-field" name="taggingStatus" value={formData.taggingStatus} onChange={handleChange}>
                    {TAGGING_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Application Status</label>
                  <select className="input-field" name="applicationStatus" value={formData.applicationStatus} onChange={handleChange}>
                    {APPLICATION_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    {formData.applicationStatus && !APPLICATION_STATUS_OPTIONS.includes(formData.applicationStatus) && (
                      <option value={formData.applicationStatus}>{formData.applicationStatus}</option>
                    )}
                  </select>
                </div>
              </div>
              {showOfferLetter && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Offer Letter</label>
                    <select className="input-field" name="offerLetterType" value={formData.offerLetterType} onChange={handleChange}>
                      <option value="">Select</option>
                      {OFFER_LETTER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  {formData.offerLetterType === 'Other' && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Other Offer Letter</label>
                      <input type="text" className="input-field" name="offerLetterOther" value={formData.offerLetterOther} onChange={handleChange} />
                    </div>
                  )}
                </div>
              )}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">University Fees</label>
                  <input type="text" className="input-field" name="universityFees" value={formData.universityFees} onChange={handleChange} placeholder="e.g. £2,000 or $1,500" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Initial Deposit</label>
                  <select className="input-field" name="initialDepositStatus" value={formData.initialDepositStatus} onChange={handleChange}>
                    <option value="">Select</option>
                    {PAID_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.initialDepositStatus === 'Paid' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Initial Deposit Amount</label>
                    <input type="text" className="input-field" name="initialDepositAmount" value={formData.initialDepositAmount} onChange={handleChange} />
                  </div>
                )}
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Enrollment Fee</label>
                  <select className="input-field" name="enrollmentFeeStatus" value={formData.enrollmentFeeStatus} onChange={handleChange}>
                    <option value="">Select</option>
                    {PAID_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.enrollmentFeeStatus === 'Paid' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Enrollment Fee Amount</label>
                    <input type="text" className="input-field" name="enrollmentFeeAmount" value={formData.enrollmentFeeAmount} onChange={handleChange} />
                  </div>
                )}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Tuition Fee</label>
                  <select className="input-field" name="tuitionFeeStatus" value={formData.tuitionFeeStatus} onChange={handleChange}>
                    <option value="">Select</option>
                    {TUITION_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.tuitionFeeStatus === 'Paid' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tuition Fee Amount</label>
                    <input type="text" className="input-field" name="tuitionFeeAmount" value={formData.tuitionFeeAmount} onChange={handleChange} />
                  </div>
                )}
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Conditions</label>
                  <textarea className="input-field" name="condition" value={formData.condition} onChange={handleChange} rows="3" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea className="input-field" name="remarks" value={formData.remarks} onChange={handleChange} rows="3" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Documents Submission</h2>
              <div className="row g-3">
                {APPLICATION_DOCUMENT_TYPES.map((type) => {
                  const files = docsForType(type);
                  return (
                    <div key={type} className="col-md-6">
                      <div style={{
                        border: files.length ? '2px solid #22c55e' : '2px dashed #d1d5db',
                        borderRadius: '12px', padding: '16px', background: files.length ? '#f0fdf4' : '#fafafa'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{type}</div>
                        {files.map((doc) => (
                          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.original_name || 'Uploaded file'}
                            </span>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <a href={`${API_URL}${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                                <FontAwesomeIcon icon={faDownload} />
                              </a>
                              {!viewOnly && (
                                <button type="button" className="btn-icon btn-delete" onClick={() => handleDeleteDocument(doc.id)}>
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {!viewOnly && (
                          <label className="btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                            <FontAwesomeIcon icon={faUpload} /> {uploadingType === type ? 'Uploading...' : 'Upload'}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              disabled={uploadingType === type}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (file) handleDocumentUpload(type, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!viewOnly && (
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate('/applications')} disabled={loading}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  <FontAwesomeIcon icon={faSave} /> {loading ? 'Updating...' : 'Update Application'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </ViewModeWrap>
  );
}
