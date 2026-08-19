import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/applications.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StudentSearchSelect from '../components/StudentSearchSelect';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUS_OPTIONS,
  OFFER_LETTER_OPTIONS,
  PAID_STATUS_OPTIONS,
  TAGGING_STATUS_OPTIONS,
  TUITION_STATUS_OPTIONS,
  getIntakeOptions,
} from '../constants/applicationOptions';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const emptyForm = {
  applicationDate: new Date().toISOString().split('T')[0],
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
};

export default function CreateApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [students, setStudents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const intakeOptions = getIntakeOptions();

  useEffect(() => { fetchStudents(); fetchCountries(); }, []);

  useEffect(() => {
    if (formData.countryId) fetchUniversitiesByCountry(formData.countryId);
    else { setUniversities([]); setFormData(prev => ({ ...prev, universityId: '' })); }
  }, [formData.countryId]);

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
      if (data.success) setUniversities(data.universities.filter(u => u.status === 'Active'));
    } catch (e) { setUniversities([]); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.countryId || !formData.universityId || !formData.program) {
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
        alert(`Application created successfully! Application ID: ${data.generatedApplicationId}`);
        navigate(`/edit-application/${data.applicationId}`);
      } else {
        alert(data.message || 'Failed to create application');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showOfferLetter = formData.applicationStatus === 'Accepted';

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
                  <input type="text" className="input-field" name="program" value={formData.program} onChange={handleChange} placeholder="Enter program name" required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Intake</label>
                  <select className="input-field" name="intake" value={formData.intake} onChange={handleChange}>
                    <option value="">Select Intake</option>
                    {intakeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.intake === 'Other' && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Other Intake</label>
                    <input type="text" className="input-field" name="intakeOther" value={formData.intakeOther} onChange={handleChange} placeholder="Enter intake" />
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
                    <input type="text" className="input-field" name="initialDepositAmount" value={formData.initialDepositAmount} onChange={handleChange} placeholder="Enter amount paid" />
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
                    <input type="text" className="input-field" name="enrollmentFeeAmount" value={formData.enrollmentFeeAmount} onChange={handleChange} placeholder="Enter amount paid" />
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
                    <input type="text" className="input-field" name="tuitionFeeAmount" value={formData.tuitionFeeAmount} onChange={handleChange} placeholder="Enter amount paid" />
                  </div>
                )}
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Conditions</label>
                  <textarea className="input-field" name="condition" value={formData.condition} onChange={handleChange} rows="3" placeholder="Enter any conditions" />
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea className="input-field" name="remarks" value={formData.remarks} onChange={handleChange} rows="3" placeholder="Enter any remarks or notes" />
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Document submission (Passport, educational documents, CV, SOP, etc.) is available after the application is created.
              </p>
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
    </>
  );
}
