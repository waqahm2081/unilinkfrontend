import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/students.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus, faArrowLeft, faSave, faPlus, faTrash,
  faCheckCircle, faExclamationTriangle, faTimes
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const STATUS_OPTIONS = [
  'Active', 'Inactive', 'Registered', 'App in Progress', 'Pending',
  'Offer Received', 'Offer Refused', 'Visa Applied', 'Visa Approved', 'Visa Rejected'
];

export default function CreateStudent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState(null);
    const [generatedStudentId, setGeneratedStudentId] = useState('');
    const [countries, setCountries] = useState([]);

    const [formData, setFormData] = useState({
        firstName: '', middleName: '', surname: '', email: '', mobile: '',
        address: '', country: '', dob: '', guardianName: '', guardianRelation: '',
        guardianMobile: '', guardianEmail: '', sourceInquiry: '', course: ''
    });

    const [educationEntries, setEducationEntries] = useState([
        { id: 1, education_level: '', institute_name: '', start_date: '', end_date: '', result: '', remarks: '' }
    ]);

    const [workExperiences, setWorkExperiences] = useState([
        { id: 1, company_name: '', designation: '', duration: '', relation: '' }
    ]);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await fetch(`${API_URL}/countries`);
            const data = await response.json();
            if (data.success) setCountries(data.countries.filter(c => c.status === 'Active'));
        } catch (err) {
            console.error('Error fetching countries:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const addEducationEntry = () => {
        setEducationEntries([...educationEntries, {
            id: educationEntries.length + 1, education_level: '', institute_name: '',
            start_date: '', end_date: '', result: '', remarks: ''
        }]);
    };

    const removeEducationEntry = (id) => {
        if (educationEntries.length > 1) setEducationEntries(educationEntries.filter(e => e.id !== id));
    };

    const handleEducationChange = (id, field, value) => {
        setEducationEntries(educationEntries.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const addWorkExperience = () => {
        setWorkExperiences([...workExperiences, {
            id: workExperiences.length + 1, company_name: '', designation: '', duration: '', relation: ''
        }]);
    };

    const removeWorkExperience = (id) => {
        if (workExperiences.length > 1) setWorkExperiences(workExperiences.filter(w => w.id !== id));
    };

    const handleWorkExperienceChange = (id, field, value) => {
        setWorkExperiences(workExperiences.map(w => w.id === id ? { ...w, [field]: value } : w));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    education: educationEntries.filter(e => e.education_level && e.institute_name && e.start_date),
                    workExperience: workExperiences.filter(w => w.company_name && w.designation)
                })
            });
            const data = await response.json();
            if (data.success) {
                setGeneratedCredentials(data.credentials);
                setGeneratedStudentId(data.generatedStudentId);
                setShowSuccessModal(true);
            } else {
                alert(data.message || 'Failed to create student');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Sidebar />
            <div className="main-content" id="mainContent">
                <Header />
                <div className="students-container">
                    <div className="students-header">
                        <div className="header-left">
                            <h1><FontAwesomeIcon icon={faUserPlus} className="page-icon" />Add New Student</h1>
                        </div>
                        <div className="header-right">
                            <Link to="/students" className="btn-secondary">
                                <FontAwesomeIcon icon={faArrowLeft} /> Back to Students
                            </Link>
                        </div>
                    </div>

                    <form className="student-form" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h2 className="section-title">Basic Information</h2>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="firstName">First Name <span className="required">*</span></label>
                                        <input type="text" id="firstName" name="firstName" className="input-field form-control"
                                            placeholder="Enter first name" value={formData.firstName} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="middleName">Middle Name</label>
                                        <input type="text" id="middleName" name="middleName" className="input-field form-control"
                                            placeholder="Enter middle name" value={formData.middleName} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="surname">Surname <span className="required">*</span></label>
                                        <input type="text" id="surname" name="surname" className="input-field form-control"
                                            placeholder="Enter surname" value={formData.surname} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="email">Email <span className="required">*</span></label>
                                        <input type="email" id="email" name="email" className="input-field form-control"
                                            placeholder="Enter email address" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="mobile">Mobile No. <span className="required">*</span></label>
                                        <input type="tel" id="mobile" name="mobile" className="input-field form-control"
                                            placeholder="Enter mobile number" value={formData.mobile} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="address">Address <span className="required">*</span></label>
                                        <textarea id="address" name="address" className="input-field form-control" rows="3"
                                            placeholder="Enter full address" value={formData.address} onChange={handleInputChange} required></textarea>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="country">Country <span className="required">*</span></label>
                                        <select id="country" name="country" className="input-field form-control"
                                            value={formData.country} onChange={handleInputChange} required>
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.id} value={c.country_name}>{c.country_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="dob">Date of Birth <span className="required">*</span></label>
                                        <input type="date" id="dob" name="dob" className="input-field form-control"
                                            value={formData.dob} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="course">Course</label>
                                        <input type="text" id="course" name="course" className="input-field form-control"
                                            placeholder="e.g., Computer Science, MBA" value={formData.course} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="sourceInquiry">Source of Inquiry</label>
                                        <select id="sourceInquiry" name="sourceInquiry" className="input-field form-control"
                                            value={formData.sourceInquiry} onChange={handleInputChange}>
                                            <option value="">Select Source</option>
                                            <option value="website">Website</option>
                                            <option value="referral">Referral</option>
                                            <option value="social-media">Social Media</option>
                                            <option value="advertisement">Advertisement</option>
                                            <option value="walk-in">Walk-in</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="guardianName">Guardian Name <span className="required">*</span></label>
                                        <input type="text" id="guardianName" name="guardianName" className="input-field form-control"
                                            placeholder="Enter guardian name" value={formData.guardianName} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="guardianRelation">Guardian Relation <span className="required">*</span></label>
                                        <input type="text" id="guardianRelation" name="guardianRelation" className="input-field form-control"
                                            placeholder="e.g., Father, Mother" value={formData.guardianRelation} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="guardianMobile">Guardian Mobile <span className="required">*</span></label>
                                        <input type="tel" id="guardianMobile" name="guardianMobile" className="input-field form-control"
                                            placeholder="Enter guardian mobile" value={formData.guardianMobile} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="guardianEmail">Guardian Email</label>
                                        <input type="email" id="guardianEmail" name="guardianEmail" className="input-field form-control"
                                            placeholder="Enter guardian email" value={formData.guardianEmail} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Education Details */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2 className="section-title">Education Details</h2>
                                <button type="button" className="btn-primary btn-sm" onClick={addEducationEntry}>
                                    <FontAwesomeIcon icon={faPlus} /> Add Education
                                </button>
                            </div>
                            {educationEntries.map((entry, index) => (
                                <div key={entry.id} className="dynamic-entry">
                                    <div className="entry-header">
                                        <h3>Education #{index + 1}</h3>
                                        {educationEntries.length > 1 && (
                                            <button type="button" className="btn-icon btn-delete" onClick={() => removeEducationEntry(entry.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Education Level</label>
                                                <select className="input-field form-control" value={entry.education_level}
                                                    onChange={(e) => handleEducationChange(entry.id, 'education_level', e.target.value)}>
                                                    <option value="">Select Level</option>
                                                    <option value="10th">10th</option>
                                                    <option value="12th">12th</option>
                                                    <option value="ug">UG (Undergraduate)</option>
                                                    <option value="pg">PG (Postgraduate)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Institute Name</label>
                                                <input type="text" className="input-field form-control" placeholder="Enter institute name"
                                                    value={entry.institute_name} onChange={(e) => handleEducationChange(entry.id, 'institute_name', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Start Date</label>
                                                <input type="date" className="input-field form-control" value={entry.start_date}
                                                    onChange={(e) => handleEducationChange(entry.id, 'start_date', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>End Date</label>
                                                <input type="date" className="input-field form-control" value={entry.end_date}
                                                    onChange={(e) => handleEducationChange(entry.id, 'end_date', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <label>Result (Marks/Grades)</label>
                                                <input type="text" className="input-field form-control" placeholder="e.g., 85% or A Grade"
                                                    value={entry.result} onChange={(e) => handleEducationChange(entry.id, 'result', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <label>Remarks</label>
                                                <textarea className="input-field form-control" rows="2" placeholder="Additional information"
                                                    value={entry.remarks} onChange={(e) => handleEducationChange(entry.id, 'remarks', e.target.value)}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Work Experience */}
                        <div className="form-section">
                            <div className="section-header">
                                <h2 className="section-title">Work Experience</h2>
                                <button type="button" className="btn-primary btn-sm" onClick={addWorkExperience}>
                                    <FontAwesomeIcon icon={faPlus} /> Add Experience
                                </button>
                            </div>
                            {workExperiences.map((experience, index) => (
                                <div key={experience.id} className="dynamic-entry">
                                    <div className="entry-header">
                                        <h3>Experience #{index + 1}</h3>
                                        {workExperiences.length > 1 && (
                                            <button type="button" className="btn-icon btn-delete" onClick={() => removeWorkExperience(experience.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Company Name</label>
                                                <input type="text" className="input-field form-control" placeholder="Enter company name"
                                                    value={experience.company_name} onChange={(e) => handleWorkExperienceChange(experience.id, 'company_name', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Designation</label>
                                                <input type="text" className="input-field form-control" placeholder="Enter designation"
                                                    value={experience.designation} onChange={(e) => handleWorkExperienceChange(experience.id, 'designation', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Duration</label>
                                                <input type="text" className="input-field form-control" placeholder="e.g., 2 years 3 months"
                                                    value={experience.duration} onChange={(e) => handleWorkExperienceChange(experience.id, 'duration', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Relation</label>
                                                <input type="text" className="input-field form-control" placeholder="Enter relation"
                                                    value={experience.relation} onChange={(e) => handleWorkExperienceChange(experience.id, 'relation', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="form-actions">
                            <Link to="/students" className="btn-secondary">Cancel</Link>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                <FontAwesomeIcon icon={faSave} /> {loading ? 'Creating...' : 'Save Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showSuccessModal && generatedCredentials && (
                <>
                    <div className="modal-backdrop show"></div>
                    <div className="modal show" style={{display: 'block'}} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header" style={{borderBottom: 'none', paddingBottom: 0}}>
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={faCheckCircle} style={{marginRight: '10px', color: '#22c55e'}} />
                                        Student Created Successfully!
                                    </h5>
                                </div>
                                <div className="modal-body">
                                    <p style={{fontSize: '16px', marginBottom: '20px'}}>
                                        Student has been created with ID: <strong>{generatedStudentId}</strong>
                                    </p>
                                    <div style={{background: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #fbbf24', marginBottom: '20px'}}>
                                        <p style={{margin: '0 0 15px 0', fontWeight: 'bold', color: '#92400e', fontSize: '14px'}}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} style={{marginRight: '8px'}} />
                                            IMPORTANT: Save these credentials now!
                                        </p>
                                        <div style={{background: 'white', padding: '15px', borderRadius: '6px'}}>
                                            <div style={{marginBottom: '15px'}}>
                                                <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px'}}>Email:</label>
                                                <div style={{fontFamily: 'monospace', fontSize: '14px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px'}}>
                                                    {generatedCredentials.email}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px'}}>Password:</label>
                                                <div style={{fontFamily: 'monospace', fontSize: '14px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', fontWeight: 'bold', color: '#F47B20'}}>
                                                    {generatedCredentials.password}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-primary" onClick={() => { setShowSuccessModal(false); setGeneratedCredentials(null); navigate('/students'); }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}