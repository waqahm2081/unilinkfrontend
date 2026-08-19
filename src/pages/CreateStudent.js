import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/students.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { REFERRED_BY_OPTIONS } from '../constants/referredByOptions'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus, faArrowLeft, faSave, faPlus, faTrash,
  faCheckCircle, faExclamationTriangle, faTimes, faGlobe,
  faPencilAlt, faUserTie, faFileAlt, faSearch, faUpload, faCamera, faUser
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const PREDEFINED_DOCS = [
  { name: 'Passport',                 type: 'Passport',           order: 1 },
  { name: 'CNIC (Back & Front)',       type: 'CNIC',               order: 2 },
  { name: 'Updated CV / Resume',       type: 'CV',                 order: 3 },
  { name: 'English Proficiency Test',  type: 'Proficiency',        order: 4 },
  { name: 'Extracurricular Certificates', type: 'Certificate',    order: 5 },
  { name: 'Essay or SOP',             type: 'SOP',                order: 6 },
  { name: 'Birth Certificate',         type: 'Birth Certificate',  order: 7 },
];

const serializePassportNumbers = (list) => {
  const cleaned = (list || []).map(v => String(v || '').trim()).filter(Boolean);
  if (!cleaned.length) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
};

const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];

const emptyEmergencyContact = {
  full_name: '', relation: '', contact_no: '', email: '', address: '', postal_code: ''
};

const emptyFamilyMember = (type) => ({
  type, full_name: '', relation: type === 'Father' ? 'Father' : type === 'Mother' ? 'Mother' : '',
  contact_no: '', email: '', profession: '', address: '', postal_code: '', sponsor_note: ''
});

const emptyEducation = () => ({
  id: Date.now() + Math.random(),
  education_level: '', institute_name: '', start_date: '', end_date: '',
  subjects: '', grade_cgpa: ''
});

const toMonthValue = (value) => {
  if (!value) return '';
  const raw = String(value).split('T')[0];
  return raw.length >= 7 ? raw.slice(0, 7) : raw;
};

const normalizeEducationEntry = (entry) => ({
  ...entry,
  id: entry.id || Date.now() + Math.random(),
  grade_cgpa: entry.grade_cgpa || entry.result || entry.cgpa || '',
  start_date: toMonthValue(entry.start_date),
  end_date: toMonthValue(entry.end_date),
});

const emptyActivity = () => ({
  id: Date.now() + Math.random(),
  activity_name: '', description: '', grade_levels: '', hours_per_week: '', weeks_per_year: ''
});

const emptyAward = () => ({
  id: Date.now() + Math.random(),
  award_name: '', recognition_level: '', award_type: '', received_date: '', description: ''
});

const emptyWork = () => ({
  id: Date.now() + Math.random(),
  company_name: '', designation: '', date_from: '', date_to: '', employment_type: ''
});

const emptyIntendedProgram = () => ({
  id: Date.now() + Math.random(),
  country_id: '', university_id: '', program_name: '', study_mode: ''
});

const normalizeIntendedProgram = (entry) => ({
  ...entry,
  id: entry.id || Date.now() + Math.random(),
  country_id: entry.country_id ? String(entry.country_id) : '',
  university_id: entry.university_id ? String(entry.university_id) : '',
  program_name: entry.program_name || '',
  study_mode: entry.study_mode || '',
});

const INTAKE_SESSION_OPTIONS = ['Jan / Feb', 'Apr / May', 'Jun / Jul', 'Aug / Sept'];
const INTAKE_YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - 1 + i));

const normalizeWorkEntry = (entry) => ({
  ...entry,
  id: entry.id || Date.now() + Math.random(),
  date_from: toMonthValue(entry.date_from),
  date_to: toMonthValue(entry.date_to),
});

export default function CreateStudent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [generatedStudentId, setGeneratedStudentId] = useState('');
  const [createdDbId, setCreatedDbId] = useState(null);

  const [allCountries, setAllCountries] = useState([]);
  const [assignedCountryIds, setAssignedCountryIds] = useState([]);
  const [showAssignCountriesModal, setShowAssignCountriesModal] = useState(false);
  const [tempSelectedCountryIds, setTempSelectedCountryIds] = useState([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');

  const [studentData, setStudentData] = useState({
    name: '', middle_name: '', surname: '',
    nationality: '', marital_status: '', gender: '',
    dob: '', city_of_birth: '', country_of_birth: '',
    passport_no: '', passport_issue_date: '', passport_place_of_issue: '',
    address: '', postal_code: '', mobile: '', landline: '',
    email: '', alternative_email: '',
    country: '', course: '',
    source_inquiry: '', status: 'Active',
    intake_session: '', intake_year: ''
  });

  const [emergencyContact, setEmergencyContact] = useState({ ...emptyEmergencyContact });

  const [familyDetails, setFamilyDetails] = useState([
    emptyFamilyMember('Father'),
    emptyFamilyMember('Mother'),
    emptyFamilyMember('Sponsor'),
  ]);

  const [sponsorRelationType, setSponsorRelationType] = useState('Guardian');
  const [emergencyRelationType, setEmergencyRelationType] = useState('Guardian');

  const [educationEntries, setEducationEntries] = useState([]);
  const [activities, setActivities] = useState([]);
  const [awards, setAwards] = useState([]);
  const [workExperiences, setWorkExperiences] = useState([]);
  const [intendedPrograms, setIntendedPrograms] = useState([]);
  const [universitiesByCountry, setUniversitiesByCountry] = useState({});
  const [passportNumbers, setPassportNumbers] = useState(['']);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchUniversitiesForAssignedCountries(assignedCountryIds);
  }, [assignedCountryIds]);

  useEffect(() => {
    if (showAssignCountriesModal) {
      setTempSelectedCountryIds([...assignedCountryIds]);
      setCountrySearchTerm('');
    }
  }, [showAssignCountriesModal]);

  const fatherMember = familyDetails.find(f => f.type === 'Father') || emptyFamilyMember('Father');
  const motherMember = familyDetails.find(f => f.type === 'Mother') || emptyFamilyMember('Mother');
  const sponsorMember = familyDetails.find(f => f.type === 'Sponsor') || emptyFamilyMember('Sponsor');
  const sponsorLocked = sponsorRelationType !== 'Guardian';
  const emergencyLocked = true; // always autofilled from Father / Mother / Sponsor-Guardian

  useEffect(() => {
    if (sponsorRelationType !== 'Father' && sponsorRelationType !== 'Mother') return;
    const source = sponsorRelationType === 'Father' ? fatherMember : motherMember;
    setFamilyDetails(prev => {
      const current = prev.find(m => m.type === 'Sponsor');
      const next = {
        full_name: source.full_name || '',
        relation: sponsorRelationType,
        contact_no: source.contact_no || '',
        email: source.email || '',
        profession: source.profession || '',
        address: source.address || '',
        postal_code: source.postal_code || '',
      };
      if (
        current &&
        current.full_name === next.full_name &&
        current.relation === next.relation &&
        current.contact_no === next.contact_no &&
        current.email === next.email &&
        current.profession === next.profession &&
        current.address === next.address &&
        current.postal_code === next.postal_code
      ) {
        return prev;
      }
      return prev.map(m => (m.type === 'Sponsor' ? { ...m, ...next } : m));
    });
  }, [
    sponsorRelationType,
    fatherMember.full_name, fatherMember.contact_no, fatherMember.email, fatherMember.profession, fatherMember.address, fatherMember.postal_code,
    motherMember.full_name, motherMember.contact_no, motherMember.email, motherMember.profession, motherMember.address, motherMember.postal_code,
  ]);

  useEffect(() => {
    let source;
    let relationValue;
    if (emergencyRelationType === 'Father') {
      source = fatherMember;
      relationValue = 'Father';
    } else if (emergencyRelationType === 'Mother') {
      source = motherMember;
      relationValue = 'Mother';
    } else {
      source = sponsorMember;
      relationValue = sponsorMember.relation || 'Guardian';
    }

    setEmergencyContact(prev => {
      const next = {
        ...prev,
        full_name: source.full_name || '',
        relation: relationValue,
        contact_no: source.contact_no || '',
        email: source.email || '',
        address: source.address || '',
        postal_code: source.postal_code || '',
      };
      if (
        prev.full_name === next.full_name &&
        prev.relation === next.relation &&
        prev.contact_no === next.contact_no &&
        prev.email === next.email &&
        prev.address === next.address &&
        prev.postal_code === next.postal_code
      ) {
        return prev;
      }
      return next;
    });
  }, [
    emergencyRelationType,
    fatherMember.full_name, fatherMember.contact_no, fatherMember.email, fatherMember.address, fatherMember.postal_code,
    motherMember.full_name, motherMember.contact_no, motherMember.email, motherMember.address, motherMember.postal_code,
    sponsorMember.full_name, sponsorMember.contact_no, sponsorMember.email, sponsorMember.address, sponsorMember.postal_code, sponsorMember.relation,
  ]);

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      if (data.success) setAllCountries(data.countries.filter(c => c.status === 'Active'));
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchUniversitiesForAssignedCountries = async (countryIds) => {
    const ids = countryIds || assignedCountryIds;
    if (!ids.length) {
      setUniversitiesByCountry({});
      return;
    }
    try {
      const results = {};
      await Promise.all(ids.map(async (countryId) => {
        const res = await fetch(`${API_URL}/universities/by-country/${countryId}`);
        const data = await res.json();
        results[String(countryId)] = data.success
          ? (data.universities || []).filter(u => u.status === 'Active' || !u.status)
          : [];
      }));
      setUniversitiesByCountry(results);
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyChange = (e) => {
    const { name, value } = e.target;
    if (emergencyLocked && name !== 'postal_code') return;
    setEmergencyContact(prev => ({ ...prev, [name]: value }));
  };

  const handleFamilyChange = (index, field, value) => {
    const memberType = familyDetails[index]?.type;
    if (memberType === 'Sponsor' && sponsorLocked) return;
    setFamilyDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSponsorRelationTypeChange = (newType) => {
    setSponsorRelationType(newType);
    if (newType === 'Guardian') {
      setFamilyDetails(prev => prev.map(m =>
        m.type === 'Sponsor'
          ? { ...m, full_name: '', relation: '', contact_no: '', email: '', profession: '', address: '', postal_code: '', sponsor_note: '' }
          : m
      ));
    }
  };

  const handleEmergencyRelationTypeChange = (newType) => {
    setEmergencyRelationType(newType);
  };

  const addEducation = () => setEducationEntries(prev => [...prev, emptyEducation()]);
  const removeEducation = (id) => setEducationEntries(prev => prev.filter(e => e.id !== id));
  const handleEduChange = (id, field, value) =>
    setEducationEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const addActivity = () => setActivities(prev => [...prev, emptyActivity()]);
  const removeActivity = (id) => setActivities(prev => prev.filter(a => a.id !== id));
  const handleActChange = (id, field, value) =>
    setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  const addAward = () => setAwards(prev => [...prev, emptyAward()]);
  const removeAward = (id) => setAwards(prev => prev.filter(a => a.id !== id));
  const handleAwardChange = (id, field, value) =>
    setAwards(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  const addWork = () => setWorkExperiences(prev => [...prev, emptyWork()]);
  const removeWork = (id) => setWorkExperiences(prev => prev.filter(w => w.id !== id));
  const handleWorkChange = (id, field, value) =>
    setWorkExperiences(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));

  const addIntendedProgram = () => setIntendedPrograms(prev => [...prev, emptyIntendedProgram()]);
  const removeIntendedProgram = (id) => setIntendedPrograms(prev => prev.filter(p => p.id !== id));
  const handleIntendedProgramChange = (id, field, value) => {
    setIntendedPrograms(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (field === 'country_id') return { ...p, country_id: value, university_id: '' };
      return { ...p, [field]: value };
    }));
  };

  const handleTempCountryToggle = (countryId) => {
    setTempSelectedCountryIds(prev =>
      prev.includes(countryId) ? prev.filter(i => i !== countryId) : [...prev, countryId]
    );
  };

  const handleSaveAssignedCountries = () => {
    setAssignedCountryIds([...tempSelectedCountryIds]);
    const names = tempSelectedCountryIds
      .map(cid => allCountries.find(c => c.id === cid))
      .filter(Boolean)
      .map(c => c.country_name)
      .join(', ');
    setStudentData(prev => ({ ...prev, country: names }));
    setShowAssignCountriesModal(false);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file for the personal picture.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Personal picture must be under 5MB.');
      return;
    }
    setError('');
    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!profilePictureFile) {
      setError('Personal picture is required. Please upload a photo at the top of the form.');
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const countryNames = assignedCountryIds
      .map(cid => allCountries.find(c => c.id === cid))
      .filter(Boolean)
      .map(c => c.country_name)
      .join(', ');

    if (!countryNames) {
      setError('Please assign at least one country before creating the student.');
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sponsor = familyDetails.find(m => m.type === 'Sponsor') || {};

    try {
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: studentData.name,
          middleName: studentData.middle_name,
          surname: studentData.surname,
          email: studentData.email,
          alternativeEmail: studentData.alternative_email,
          mobile: studentData.mobile,
          landline: studentData.landline,
          address: studentData.address,
          postalCode: studentData.postal_code,
          country: countryNames,
          dob: studentData.dob,
          nationality: studentData.nationality,
          maritalStatus: studentData.marital_status,
          gender: studentData.gender,
          cityOfBirth: studentData.city_of_birth,
          countryOfBirth: studentData.country_of_birth,
          passportNo: serializePassportNumbers(passportNumbers),
          passportIssueDate: studentData.passport_issue_date,
          passportPlaceOfIssue: studentData.passport_place_of_issue,
          guardianName: sponsor.full_name || null,
          guardianRelation: sponsor.relation || null,
          guardianMobile: sponsor.contact_no || null,
          guardianEmail: sponsor.email || null,
          sourceInquiry: studentData.source_inquiry,
          status: studentData.status,
          course: studentData.course,
          emergencyContact,
          familyDetails,
          education: educationEntries,
          activities,
          awards,
          workExperience: workExperiences,
          intendedPrograms,
          intakeSession: studentData.intake_session,
          intakeYear: studentData.intake_year
        })
      });
      const data = await response.json();
      if (data.success) {
        try {
          const formData = new FormData();
          formData.append('profilePicture', profilePictureFile);
          const picRes = await fetch(`${API_URL}/students/${data.studentId}/profile-picture`, {
            method: 'POST',
            body: formData
          });
          const picData = await picRes.json();
          if (!picData.success) {
            console.warn('Profile picture upload failed:', picData.message);
          }
        } catch (picErr) {
          console.warn('Profile picture upload error:', picErr);
        }
        setGeneratedCredentials(data.credentials);
        setGeneratedStudentId(data.generatedStudentId);
        setCreatedDbId(data.studentId);
        setShowSuccessModal(true);
      } else {
        setError(data.message || 'Failed to create student');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Network error. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignCountries = allCountries.filter(c =>
    c.country_name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const sectionStyle = {
    background: 'white', borderRadius: '12px', padding: '28px',
    marginBottom: '24px', border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  };
  const sectionTitleStyle = {
    fontSize: '17px', fontWeight: '700', color: '#111827',
    marginBottom: '20px', paddingBottom: '12px',
    borderBottom: '2px solid #F47B20', display: 'flex', alignItems: 'center', gap: '8px'
  };
  const subTitleStyle = {
    fontSize: '15px', fontWeight: '600', color: '#374151',
    margin: '20px 0 14px', paddingLeft: '12px',
    borderLeft: '3px solid #F47B20'
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="students-container">

          <div className="students-header">
            <div className="header-left">
              <h1>
                <FontAwesomeIcon icon={faUserPlus} className="page-icon" />
                Add New Student
              </h1>
            </div>
            <div className="header-right">
              <button type="button" className="btn-primary"
                onClick={() => setShowAssignCountriesModal(true)} style={{ marginRight: '10px' }}>
                <FontAwesomeIcon icon={faGlobe} /> Assign Countries
              </button>
              <Link to="/students" className="btn-secondary">
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Students
              </Link>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px',
              borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form className="student-form" onSubmit={handleSubmit}>

            {/* SECTION 1: APPLICANT'S INFORMATION */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Applicant's Information</h2>

              {/* Personal Picture */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                marginBottom: '28px', padding: '24px 16px',
                background: 'linear-gradient(135deg, #FFF8F0 0%, #F5F7FA 100%)',
                borderRadius: '16px', border: '1px solid #FFE0B2'
              }}>
                <div style={{
                  width: '140px', height: '140px', borderRadius: '50%',
                  overflow: 'hidden', background: '#fff',
                  border: profilePicturePreview ? '3px solid #F47B20' : '3px dashed #d1d5db',
                  boxShadow: '0 8px 24px rgba(244,123,32,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Student"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FontAwesomeIcon icon={faUser} style={{ fontSize: '52px', color: '#d1d5db' }} />
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>
                  Personal Picture <span className="required">*</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', textAlign: 'center' }}>
                  Required passport-style photo · JPG / PNG · Max 5MB
                </div>
                <label className="btn-primary" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', margin: 0, fontSize: '13px', padding: '8px 16px'
                }}>
                  <FontAwesomeIcon icon={faCamera} />
                  {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleProfilePictureChange}
                    style={{ display: 'none' }}
                  />
                </label>
                {!profilePicturePreview && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#c62828' }}>
                    Form cannot be submitted without a personal picture
                  </div>
                )}
              </div>

              <div className="row">

                <div className="col-md-4">
                  <div className="form-group">
                    <label>First Name (As Per Passport) <span className="required">*</span></label>
                    <input type="text" name="name" className="input-field form-control"
                      value={studentData.name} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Middle Name (As Per Passport)</label>
                    <input type="text" name="middle_name" className="input-field form-control"
                      value={studentData.middle_name || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Last Name (As Per Passport) <span className="required">*</span></label>
                    <input type="text" name="surname" className="input-field form-control"
                      value={studentData.surname} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="form-group">
                    <label>Date of Birth <span className="required">*</span></label>
                    <input type="date" name="dob" className="input-field form-control"
                      value={studentData.dob || ''} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group">
                    <label>Nationality</label>
                    <input type="text" name="nationality" className="input-field form-control"
                      value={studentData.nationality || ''} onChange={handleInputChange}
                      placeholder="e.g. Pakistani" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>City of Birth</label>
                    <input type="text" name="city_of_birth" className="input-field form-control"
                      value={studentData.city_of_birth || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Country of Birth</label>
                    <input type="text" name="country_of_birth" className="input-field form-control"
                      value={studentData.country_of_birth || ''} onChange={handleInputChange}
                      placeholder="e.g. Pakistan" />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group">
                    <label>Passport No.</label>
                    {passportNumbers.map((num, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: idx < passportNumbers.length - 1 ? '8px' : 0 }}>
                        <input
                          type="text"
                          className="input-field form-control"
                          value={num}
                          placeholder={idx === 0 ? 'Passport number' : `Passport number #${idx + 1}`}
                          onChange={(e) => {
                            const next = [...passportNumbers];
                            next[idx] = e.target.value;
                            setPassportNumbers(next);
                          }}
                        />
                        {passportNumbers.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon btn-delete"
                            title="Remove"
                            onClick={() => setPassportNumbers(passportNumbers.filter((_, i) => i !== idx))}
                            style={{ width: '38px', height: '38px', flexShrink: 0 }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Date of Issue</label>
                    <input type="date" name="passport_issue_date" className="input-field form-control"
                      value={studentData.passport_issue_date || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Place of Issue</label>
                    <input type="text" name="passport_place_of_issue" className="input-field form-control"
                      value={studentData.passport_place_of_issue || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '12px' }}
                      onClick={() => setPassportNumbers([...passportNumbers, ''])}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Passport Number
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" className="input-field form-control"
                      value={studentData.gender || ''} onChange={handleInputChange}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Marital Status</label>
                    <select name="marital_status" className="input-field form-control"
                      value={studentData.marital_status || ''} onChange={handleInputChange}>
                      <option value="">Select</option>
                      {MARITAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div className="col-md-9">
                  <div className="form-group">
                    <label>Current Residential Address for Correspondence <span className="required">*</span></label>
                    <textarea name="address" className="input-field form-control" rows="2"
                      value={studentData.address} onChange={handleInputChange} required></textarea>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input type="text" name="postal_code" className="input-field form-control"
                      value={studentData.postal_code || ''} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label>Mobile No. <span className="required">*</span></label>
                    <input type="tel" name="mobile" className="input-field form-control"
                      value={studentData.mobile} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Landline No.</label>
                    <input type="tel" name="landline" className="input-field form-control"
                      value={studentData.landline || ''} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" name="email" className="input-field form-control"
                      value={studentData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Alternative Email</label>
                    <input type="email" name="alternative_email" className="input-field form-control"
                      value={studentData.alternative_email || ''} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group">
                    <label>Course</label>
                    <input type="text" name="course" className="input-field form-control"
                      value={studentData.course || ''} onChange={handleInputChange}
                      placeholder="e.g. Computer Science, MBA" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Source of Inquiry</label>
                    <select name="source_inquiry" className="input-field form-control"
                      value={studentData.source_inquiry || ''} onChange={handleInputChange}>
                      <option value="">Select Source</option>
                      {REFERRED_BY_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Status <span className="required">*</span></label>
                    <select name="status" className="input-field form-control"
                      value={studentData.status} onChange={handleInputChange} required>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Registered">Registered</option>
                      <option value="App in Progress">App in Progress</option>
                      <option value="Pending">Pending</option>
                      <option value="Offer Received">Offer Received</option>
                      <option value="Offer Refused">Offer Refused</option>
                      <option value="Visa Applied">Visa Applied</option>
                      <option value="Visa Approved">Visa Approved</option>
                      <option value="Visa Rejected">Visa Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PARENTS DETAILS */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Parents Details</h2>

              {familyDetails.map((member, index) => (
                <div key={member.type}>
                  {member.type === 'Father' && (
                    <>
                      <h3 style={subTitleStyle}>Father</h3>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" className="input-field form-control"
                              value={member.full_name || ''}
                              onChange={e => handleFamilyChange(index, 'full_name', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Relation</label>
                            <input type="text" className="input-field form-control"
                              value={member.relation || ''}
                              onChange={e => handleFamilyChange(index, 'relation', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Profession</label>
                            <input type="text" className="input-field form-control"
                              value={member.profession || ''}
                              onChange={e => handleFamilyChange(index, 'profession', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Contact No.</label>
                            <input type="tel" className="input-field form-control"
                              value={member.contact_no || ''}
                              onChange={e => handleFamilyChange(index, 'contact_no', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-8">
                          <div className="form-group">
                            <label>Email</label>
                            <input type="email" className="input-field form-control"
                              value={member.email || ''}
                              onChange={e => handleFamilyChange(index, 'email', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-9">
                          <div className="form-group">
                            <label>Current Residential Address</label>
                            <textarea className="input-field form-control" rows="2"
                              value={member.address || ''}
                              onChange={e => handleFamilyChange(index, 'address', e.target.value)}></textarea>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label>Postal Code</label>
                            <input type="text" className="input-field form-control"
                              value={member.postal_code || ''}
                              onChange={e => handleFamilyChange(index, 'postal_code', e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <hr style={{ margin: '8px 0 20px', borderColor: '#f3f4f6' }} />
                    </>
                  )}

                  {member.type === 'Mother' && (
                    <>
                      <h3 style={subTitleStyle}>Mother</h3>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" className="input-field form-control"
                              value={member.full_name || ''}
                              onChange={e => handleFamilyChange(index, 'full_name', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Relation</label>
                            <input type="text" className="input-field form-control"
                              value={member.relation || ''}
                              onChange={e => handleFamilyChange(index, 'relation', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Profession</label>
                            <input type="text" className="input-field form-control"
                              value={member.profession || ''}
                              onChange={e => handleFamilyChange(index, 'profession', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Contact No.</label>
                            <input type="tel" className="input-field form-control"
                              value={member.contact_no || ''}
                              onChange={e => handleFamilyChange(index, 'contact_no', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-8">
                          <div className="form-group">
                            <label>Email</label>
                            <input type="email" className="input-field form-control"
                              value={member.email || ''}
                              onChange={e => handleFamilyChange(index, 'email', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-9">
                          <div className="form-group">
                            <label>Current Residential Address</label>
                            <textarea className="input-field form-control" rows="2"
                              value={member.address || ''}
                              onChange={e => handleFamilyChange(index, 'address', e.target.value)}></textarea>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label>Postal Code</label>
                            <input type="text" className="input-field form-control"
                              value={member.postal_code || ''}
                              onChange={e => handleFamilyChange(index, 'postal_code', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* SECTION 3: SPONSOR / GUARDIAN */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Sponsor / Guardian</h2>
              {(() => {
                const sponsorIndex = familyDetails.findIndex(m => m.type === 'Sponsor');
                const member = familyDetails[sponsorIndex] || emptyFamilyMember('Sponsor');
                return (
                  <>
                    <div className="row" style={{ marginBottom: '4px' }}>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Sponsor is the Student's</label>
                          <select
                            className="input-field form-control"
                            value={sponsorRelationType}
                            onChange={e => handleSponsorRelationTypeChange(e.target.value)}
                          >
                            <option value="Father">Father (auto-fill from Father details)</option>
                            <option value="Mother">Mother (auto-fill from Mother details)</option>
                            <option value="Guardian">Guardian (enter manually)</option>
                          </select>
                          {sponsorLocked && (
                            <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                              Fields auto-filled from {sponsorRelationType} details — not editable.
                            </small>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input type="text" className="input-field form-control"
                            value={member.full_name || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'full_name', e.target.value)}
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Relation</label>
                          <input type="text" className="input-field form-control"
                            value={member.relation || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'relation', e.target.value)}
                            placeholder="e.g. Father, Mother, Uncle"
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Contact No.</label>
                          <input type="tel" className="input-field form-control"
                            value={member.contact_no || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'contact_no', e.target.value)}
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Email</label>
                          <input type="email" className="input-field form-control"
                            value={member.email || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'email', e.target.value)}
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Profession</label>
                          <input type="text" className="input-field form-control"
                            value={member.profession || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'profession', e.target.value)}
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                        </div>
                      </div>
                      <div className="col-md-9">
                        <div className="form-group">
                          <label>Current Residential Address</label>
                          <textarea className="input-field form-control" rows="2"
                            value={member.address || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'address', e.target.value)}
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined}></textarea>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Postal Code</label>
                          <input type="text" className="input-field form-control"
                            value={member.postal_code || ''}
                            onChange={e => handleFamilyChange(sponsorIndex, 'postal_code', e.target.value)}
                            readOnly={sponsorLocked}
                            style={sponsorLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* SECTION 4: EMERGENCY CONTACT */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Emergency Contact Details</h2>
              <div className="row" style={{ marginBottom: '4px' }}>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Emergency Contact is the Student's</label>
                    <select
                      className="input-field form-control"
                      value={emergencyRelationType}
                      onChange={e => handleEmergencyRelationTypeChange(e.target.value)}
                    >
                      <option value="Father">Father (auto-fill from Father details)</option>
                      <option value="Mother">Mother (auto-fill from Mother details)</option>
                      <option value="Guardian">Guardian (auto-fill from Sponsor / Guardian)</option>
                    </select>
                    <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                      Fields auto-filled from {emergencyRelationType === 'Guardian' ? 'Sponsor / Guardian' : emergencyRelationType} details — not editable.
                    </small>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="full_name" className="input-field form-control"
                      value={emergencyContact.full_name} onChange={handleEmergencyChange}
                      readOnly={emergencyLocked}
                      style={emergencyLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Relation</label>
                    <input type="text" name="relation" className="input-field form-control"
                      value={emergencyContact.relation} onChange={handleEmergencyChange}
                      readOnly={emergencyLocked}
                      style={emergencyLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Contact No.</label>
                    <input type="tel" name="contact_no" className="input-field form-control"
                      value={emergencyContact.contact_no} onChange={handleEmergencyChange}
                      readOnly={emergencyLocked}
                      style={emergencyLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" className="input-field form-control"
                      value={emergencyContact.email} onChange={handleEmergencyChange}
                      readOnly={emergencyLocked}
                      style={emergencyLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined} />
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="form-group">
                    <label>Current Residential Address</label>
                    <textarea name="address" className="input-field form-control" rows="2"
                      value={emergencyContact.address} onChange={handleEmergencyChange}
                      readOnly={emergencyLocked}
                      style={emergencyLocked ? { background: '#f3f4f6', cursor: 'not-allowed' } : undefined}></textarea>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input type="text" name="postal_code" className="input-field form-control"
                      value={emergencyContact.postal_code} onChange={handleEmergencyChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: ASSIGNED COUNTRIES */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  <FontAwesomeIcon icon={faGlobe} style={{ color: '#F47B20' }} />
                  Assigned Countries
                </h2>
                <button type="button" className="btn-primary btn-sm"
                  onClick={() => setShowAssignCountriesModal(true)}>
                  <FontAwesomeIcon icon={faPencilAlt} /> Edit Countries
                </button>
              </div>

              {assignedCountryIds.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {assignedCountryIds.map(cid => {
                    const country = allCountries.find(c => c.id === cid);
                    if (!country) return null;
                    return (
                      <div key={cid} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', background: '#fff7ed',
                        border: '1.5px solid #F47B20', borderRadius: '25px',
                        fontSize: '14px', fontWeight: '600', color: '#c2440e'
                      }}>
                        <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '13px', color: '#F47B20' }} />
                        {country.country_name}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-data-message">
                  <FontAwesomeIcon icon={faGlobe} className="no-data-icon" style={{ opacity: 0.25, fontSize: '36px', display: 'block', marginBottom: '10px' }} />
                  <p>No countries assigned yet. Click <strong>Edit Countries</strong> or use the <strong>Assign Countries</strong> button above to add countries.</p>
                </div>
              )}
            </div>

            {/* SECTION 6: ASSIGNED COUNSELORS */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20' }} />
                  Assigned Counselors
                </h2>
              </div>
              <div className="no-data-message">
                <FontAwesomeIcon icon={faUserTie} className="no-data-icon" />
                <p>Counselors can be assigned after the student is created.</p>
              </div>
            </div>

            {/* SECTION 7: EDUCATION HISTORY */}
            <div style={sectionStyle}>
              <h2 style={{ ...sectionTitleStyle, marginBottom: '8px' }}>
                Applicant's Education Details
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Educational History (in descending order — most recent first)
              </p>

              {educationEntries.length > 0 ? (
                educationEntries.map((entry, index) => (
                  <div key={entry.id} className="dynamic-entry">
                    <div className="entry-header">
                      <h3>Education #{index + 1}</h3>
                      <button type="button" className="btn-icon btn-delete" onClick={() => removeEducation(entry.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Qualification</label>
                          <input type="text" className="input-field form-control"
                            value={entry.education_level || ''}
                            onChange={e => handleEduChange(entry.id, 'education_level', e.target.value)}
                            placeholder="e.g. 12th, Bachelor of Science" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Institution</label>
                          <input type="text" className="input-field form-control"
                            value={entry.institute_name || ''}
                            onChange={e => handleEduChange(entry.id, 'institute_name', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Duration From (Month &amp; Year)</label>
                          <input type="month" className="input-field form-control"
                            value={entry.start_date || ''}
                            onChange={e => handleEduChange(entry.id, 'start_date', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Duration To (Month &amp; Year)</label>
                          <input type="month" className="input-field form-control"
                            value={entry.end_date || ''}
                            onChange={e => handleEduChange(entry.id, 'end_date', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Subjects</label>
                          <input type="text" className="input-field form-control"
                            value={entry.subjects || ''}
                            onChange={e => handleEduChange(entry.id, 'subjects', e.target.value)}
                            placeholder="e.g. Math, Physics, Chemistry" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Grade / CGPA</label>
                          <input type="text" className="input-field form-control"
                            value={entry.grade_cgpa || ''}
                            onChange={e => handleEduChange(entry.id, 'grade_cgpa', e.target.value)}
                            placeholder="e.g. A, 85%, 3.8 / 4.0" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">
                  <p>No education records added yet. Click "Add Education" to begin.</p>
                </div>
              )}
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="btn-primary btn-sm" onClick={addEducation}>
                  <FontAwesomeIcon icon={faPlus} /> Add Education
                </button>
              </div>

              <div style={{ marginTop: '28px' }}>
                <h3 style={subTitleStyle}>Co-curricular Activities / Achievements</h3>

                {activities.length > 0 ? (
                  activities.map((act, index) => (
                    <div key={act.id} className="dynamic-entry">
                      <div className="entry-header">
                        <h3>Activity #{index + 1}</h3>
                        <button type="button" className="btn-icon btn-delete" onClick={() => removeActivity(act.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Activity Name</label>
                            <input type="text" className="input-field form-control"
                              value={act.activity_name || ''}
                              onChange={e => handleActChange(act.id, 'activity_name', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Participation Grade Levels (e.g. 9, 10, 11, 12)</label>
                            <input type="text" className="input-field form-control"
                              value={act.grade_levels || ''}
                              onChange={e => handleActChange(act.id, 'grade_levels', e.target.value)}
                              placeholder="e.g. 9, 10, 11" />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Hours Spent Per Week</label>
                            <input type="number" className="input-field form-control" min="0" step="0.5"
                              value={act.hours_per_week || ''}
                              onChange={e => handleActChange(act.id, 'hours_per_week', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label>Weeks Spent Per Year</label>
                            <input type="number" className="input-field form-control" min="0"
                              value={act.weeks_per_year || ''}
                              onChange={e => handleActChange(act.id, 'weeks_per_year', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="form-group">
                            <label>Describe Activity <small style={{ color: '#9ca3af' }}>(max 350 characters)</small></label>
                            <textarea className="input-field form-control" rows="2" maxLength={350}
                              value={act.description || ''}
                              onChange={e => handleActChange(act.id, 'description', e.target.value)}></textarea>
                            <small style={{ color: '#9ca3af', fontSize: '11px' }}>
                              {(act.description || '').length} / 350
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data-message">
                    <p>No activities added yet.</p>
                  </div>
                )}
                <div style={{ marginTop: '12px' }}>
                  <button type="button" className="btn-primary btn-sm" onClick={addActivity}>
                    <FontAwesomeIcon icon={faPlus} /> Add Activity
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <h3 style={subTitleStyle}>Awards</h3>

                {awards.length > 0 ? (
                  awards.map((award, index) => (
                    <div key={award.id} className="dynamic-entry">
                      <div className="entry-header">
                        <h3>Award #{index + 1}</h3>
                        <button type="button" className="btn-icon btn-delete" onClick={() => removeAward(award.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Name of Honor / Award</label>
                            <input type="text" className="input-field form-control"
                              value={award.award_name || ''}
                              onChange={e => handleAwardChange(award.id, 'award_name', e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Level of Recognition</label>
                            <select className="input-field form-control"
                              value={award.recognition_level || ''}
                              onChange={e => handleAwardChange(award.id, 'recognition_level', e.target.value)}>
                              <option value="">Select Level</option>
                              <option value="School">School</option>
                              <option value="District">District</option>
                              <option value="Provincial">Provincial</option>
                              <option value="National">National</option>
                              <option value="International">International</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Type of Award or Honor</label>
                            <input type="text" className="input-field form-control"
                              value={award.award_type || ''}
                              onChange={e => handleAwardChange(award.id, 'award_type', e.target.value)}
                              placeholder="e.g. Academic, Sports, Arts" />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>When Did You Receive It?</label>
                            <input type="text" className="input-field form-control"
                              value={award.received_date || ''}
                              onChange={e => handleAwardChange(award.id, 'received_date', e.target.value)}
                              placeholder="e.g. June 2023" />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="form-group">
                            <label>What did you do to achieve this? <small style={{ color: '#9ca3af' }}>(max 350 characters)</small></label>
                            <textarea className="input-field form-control" rows="2" maxLength={350}
                              value={award.description || ''}
                              onChange={e => handleAwardChange(award.id, 'description', e.target.value)}></textarea>
                            <small style={{ color: '#9ca3af', fontSize: '11px' }}>
                              {(award.description || '').length} / 350
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data-message"><p>No awards added yet.</p></div>
                )}
                <div style={{ marginTop: '12px' }}>
                  <button type="button" className="btn-primary btn-sm" onClick={addAward}>
                    <FontAwesomeIcon icon={faPlus} /> Add Award
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 7: WORK EXPERIENCE */}
            <div style={sectionStyle}>
              <h2 style={{ ...sectionTitleStyle, marginBottom: '20px' }}>
                Applicant's Work Experience
              </h2>

              {workExperiences.length > 0 ? (
                workExperiences.map((exp, index) => (
                  <div key={exp.id} className="dynamic-entry">
                    <div className="entry-header">
                      <h3>Experience #{index + 1}</h3>
                      <button type="button" className="btn-icon btn-delete" onClick={() => removeWork(exp.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Organization Name</label>
                          <input type="text" className="input-field form-control"
                            value={exp.company_name || ''}
                            onChange={e => handleWorkChange(exp.id, 'company_name', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Designation</label>
                          <input type="text" className="input-field form-control"
                            value={exp.designation || ''}
                            onChange={e => handleWorkChange(exp.id, 'designation', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Duration From (Month &amp; Year)</label>
                          <input type="month" className="input-field form-control"
                            value={exp.date_from || ''}
                            onChange={e => handleWorkChange(exp.id, 'date_from', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Duration To (Month &amp; Year)</label>
                          <input type="month" className="input-field form-control"
                            value={exp.date_to || ''}
                            onChange={e => handleWorkChange(exp.id, 'date_to', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Full or Part Time</label>
                          <select className="input-field form-control"
                            value={exp.employment_type || ''}
                            onChange={e => handleWorkChange(exp.id, 'employment_type', e.target.value)}>
                            <option value="">Select</option>
                            <option value="Full Time">Full Time</option>
                            <option value="Part Time">Part Time</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message"><p>No work experience added yet.</p></div>
              )}
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="btn-primary btn-sm" onClick={addWork}>
                  <FontAwesomeIcon icon={faPlus} /> Add Experience
                </button>
              </div>
            </div>

            {/* SECTION: INTENDED PROGRAM OF STUDY */}
            <div style={sectionStyle}>
              <h2 style={{ ...sectionTitleStyle, marginBottom: '20px' }}>
                Intended Program of Study
              </h2>

              {intendedPrograms.length > 0 ? (
                intendedPrograms.map((entry, index) => {
                  const unis = universitiesByCountry[String(entry.country_id)] || [];
                  return (
                    <div key={entry.id} className="dynamic-entry">
                      <div className="entry-header">
                        <h3>Program #{index + 1}</h3>
                        <button type="button" className="btn-icon btn-delete" onClick={() => removeIntendedProgram(entry.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Country</label>
                            <select className="input-field form-control"
                              value={entry.country_id}
                              onChange={e => handleIntendedProgramChange(entry.id, 'country_id', e.target.value)}>
                              <option value="">{assignedCountryIds.length ? 'Select Country' : 'Assign countries first'}</option>
                              {allCountries.filter(c => assignedCountryIds.includes(c.id)).map(c => (
                                <option key={c.id} value={c.id}>{c.country_name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Institution</label>
                            <select className="input-field form-control"
                              value={entry.university_id}
                              onChange={e => handleIntendedProgramChange(entry.id, 'university_id', e.target.value)}
                              disabled={!entry.country_id}>
                              <option value="">{entry.country_id ? 'Select Institution' : 'Select a country first'}</option>
                              {unis.map(u => (
                                <option key={u.id} value={u.id}>{u.university_name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Program(s)</label>
                            <input type="text" className="input-field form-control"
                              value={entry.program_name || ''}
                              onChange={e => handleIntendedProgramChange(entry.id, 'program_name', e.target.value)}
                              placeholder="e.g. Computer Science" />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Full / Part Time</label>
                            <select className="input-field form-control"
                              value={entry.study_mode || ''}
                              onChange={e => handleIntendedProgramChange(entry.id, 'study_mode', e.target.value)}>
                              <option value="">Select</option>
                              <option value="Full Time">Full Time</option>
                              <option value="Part Time">Part Time</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data-message"><p>No intended programs added yet. Click "Add Program" to begin.</p></div>
              )}
              <div style={{ marginTop: '12px', marginBottom: '20px' }}>
                <button type="button" className="btn-primary btn-sm" onClick={addIntendedProgram}>
                  <FontAwesomeIcon icon={faPlus} /> Add Program
                </button>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Intake – Session</label>
                    <select name="intake_session" className="input-field form-control"
                      value={studentData.intake_session || ''} onChange={handleInputChange}>
                      <option value="">Select Session</option>
                      {INTAKE_SESSION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Intake Year</label>
                    <select name="intake_year" className="input-field form-control"
                      value={studentData.intake_year || ''} onChange={handleInputChange}>
                      <option value="">Select Year</option>
                      {INTAKE_YEAR_OPTIONS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 8: DOCUMENTS UPLOAD */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  Documents Upload
                </h2>
              </div>

              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Documents can be uploaded after the student is created from the Edit Student page.
              </p>

              <div className="row g-3">
                {PREDEFINED_DOCS.map((slot) => (
                  <div key={slot.name} className="col-md-6">
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px', padding: '18px', background: '#fafafa',
                      transition: 'all 0.2s', opacity: 0.7
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <FontAwesomeIcon icon={faFileAlt} style={{ color: '#9ca3af', fontSize: '20px' }} />
                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                              {slot.name}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>
                            Available after saving
                          </p>
                        </div>
                        <button type="button" className="btn-primary btn-sm" style={{ fontSize: '12px' }} disabled>
                          <FontAwesomeIcon icon={faUpload} /> Upload
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <Link to="/students" className="btn-secondary">Cancel</Link>
              <button type="submit" className="btn-primary" disabled={loading}>
                <FontAwesomeIcon icon={faSave} />
                {loading ? 'Creating...' : 'Save Student'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Assign Countries Modal */}
      {showAssignCountriesModal && (
        <>
          <div className="modal-backdrop show"
            onClick={() => setShowAssignCountriesModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '10px' }} />
                    Assign Countries
                  </h5>
                  <button type="button" className="btn-close-modal"
                    onClick={() => setShowAssignCountriesModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>
                    Select countries this student is interested in. These will be used when creating applications.
                  </p>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="text"
                      className="input-field form-control"
                      placeholder="Search countries..."
                      value={countrySearchTerm}
                      onChange={e => setCountrySearchTerm(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredAssignCountries.length > 0 ? (
                      <div className="row g-2">
                        {filteredAssignCountries.map(country => {
                          const isSelected = tempSelectedCountryIds.includes(country.id);
                          return (
                            <div key={country.id} className="col-md-6">
                              <div
                                style={{
                                  border: isSelected ? '2px solid #F47B20' : '1px solid #e5e7eb',
                                  borderRadius: '10px', padding: '14px 16px',
                                  cursor: 'pointer', background: isSelected ? '#fff7ed' : 'white',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  transition: 'all 0.15s'
                                }}
                                onClick={() => handleTempCountryToggle(country.id)}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#F47B20'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <FontAwesomeIcon icon={faGlobe}
                                    style={{ color: isSelected ? '#F47B20' : '#9ca3af', fontSize: '15px' }} />
                                  <span style={{
                                    fontWeight: isSelected ? '600' : '400',
                                    fontSize: '14px',
                                    color: isSelected ? '#c2440e' : '#374151'
                                  }}>
                                    {country.country_name}
                                  </span>
                                </div>
                                <div style={{
                                  width: '20px', height: '20px', borderRadius: '5px',
                                  border: isSelected ? '2px solid #F47B20' : '2px solid #d1d5db',
                                  background: isSelected ? '#F47B20' : 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isSelected && (
                                    <FontAwesomeIcon icon={faCheckCircle}
                                      style={{ color: 'white', fontSize: '11px' }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                        <p>No countries found</p>
                      </div>
                    )}
                  </div>

                  {tempSelectedCountryIds.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '10px 14px', background: '#fff7ed',
                      border: '1px solid #F47B20', borderRadius: '8px' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#c2440e' }}>
                        <strong>{tempSelectedCountryIds.length}</strong> {tempSelectedCountryIds.length === 1 ? 'country' : 'countries'} selected
                      </p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary"
                    onClick={() => setShowAssignCountriesModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary"
                    onClick={handleSaveAssignedCountries}>
                    <FontAwesomeIcon icon={faSave} />
                    Save Countries
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showSuccessModal && generatedCredentials && (
        <>
          <div className="modal-backdrop show"></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '10px', color: '#22c55e' }} />
                    Student Created Successfully!
                  </h5>
                </div>
                <div className="modal-body">
                  <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                    Student has been created with ID: <strong>{generatedStudentId}</strong>
                  </p>
                  <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #fbbf24', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#92400e', fontSize: '14px' }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
                      IMPORTANT: Save these credentials now!
                    </p>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Email:</label>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                          {generatedCredentials.email}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Password:</label>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', fontWeight: 'bold', color: '#F47B20' }}>
                          {generatedCredentials.password}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {createdDbId && (
                    <button type="button" className="btn-secondary"
                      onClick={() => { setShowSuccessModal(false); navigate(`/edit-student/${createdDbId}`); }}>
                      Continue Editing
                    </button>
                  )}
                  <button type="button" className="btn-primary"
                    onClick={() => { setShowSuccessModal(false); setGeneratedCredentials(null); navigate('/students'); }}>
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
