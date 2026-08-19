import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/students.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import MeetingScheduler from '../components/MeetingScheduler'
import { ViewModeWrap } from '../components/ViewRecordModal'
import { REFERRED_BY_OPTIONS, normalizeSourceInquiry } from '../constants/referredByOptions'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGraduate, faArrowLeft, faSave, faPlus, faTrash, faUpload,
  faUserTie, faTimes, faCalendarAlt, faCheckCircle, faClock,
  faHistory, faSearch, faFileAlt, faDownload, faFileUpload,
  faImage, faGraduationCap, faExclamationTriangle, faCloudUploadAlt,
  faGlobe, faPencilAlt, faUniversity, faExternalLinkAlt, faChevronDown,
  faChevronUp, faCamera, faUser
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const parseLeadCountriesValue = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(c => String(c).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(c => String(c).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const resolveLeadCountryNames = (countriesOfInterest, countriesOther) => {
  const other = (countriesOther || '').trim();
  return parseLeadCountriesValue(countriesOfInterest)
    .map(c => (c.toLowerCase() === 'other' ? (other || null) : c))
    .filter(Boolean);
};

const PREDEFINED_DOCS = [
  { name: 'Passport',                 type: 'Passport',           order: 1 },
  { name: 'CNIC (Back & Front)',       type: 'CNIC',               order: 2 },
  { name: 'Updated CV / Resume',       type: 'CV',                 order: 3 },
  { name: 'English Proficiency Test',  type: 'Proficiency',        order: 4 },
  { name: 'Extracurricular Certificates', type: 'Certificate',    order: 5 },
  { name: 'Essay or SOP',             type: 'SOP',                order: 6 },
  { name: 'Birth Certificate',         type: 'Birth Certificate',  order: 7 },
];

const parsePassportNumbers = (value) => {
  if (!value) return [''];
  if (Array.isArray(value)) {
    const list = value.map(v => String(v || '').trim()).filter(Boolean);
    return list.length ? list : [''];
  }
  const str = String(value).trim();
  if (!str) return [''];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      const list = parsed.map(v => String(v || '').trim()).filter(Boolean);
      return list.length ? list : [''];
    }
  } catch { /* plain string */ }
  if (str.includes(',')) {
    const list = str.split(',').map(s => s.trim()).filter(Boolean);
    return list.length ? list : [''];
  }
  return [str];
};

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

export default function EditStudent({ recordId, viewOnly = false } = {}) {
  const { id: paramId } = useParams();
  const id = recordId || paramId;
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Application modal — university-based
  const [showApplicationModal, setShowApplicationModal]   = useState(false);
  const [allCountries, setAllCountries]                   = useState([]);
  const [existingApplications, setExistingApplications]  = useState([]);
  const [creatingApplications, setCreatingApplications]  = useState(false);

  const [universitiesByCountry, setUniversitiesByCountry]   = useState({});
  const [loadingUniversities, setLoadingUniversities]       = useState(false);
  const [selectedUniversityIds, setSelectedUniversityIds]   = useState([]);
  const [expandedCountries, setExpandedCountries]           = useState([]);

  // Assign Countries modal
  const [showAssignCountriesModal, setShowAssignCountriesModal] = useState(false);
  const [assignedCountryIds, setAssignedCountryIds]             = useState([]);
  const [tempSelectedCountryIds, setTempSelectedCountryIds]     = useState([]);
  const [savingCountries, setSavingCountries]                   = useState(false);
  const [countrySearchTerm, setCountrySearchTerm]               = useState('');

  // ---- Main student state ----
  const [studentData, setStudentData] = useState({
    student_id: '', name: '', middle_name: '', surname: '',
    nationality: '', marital_status: '', gender: '',
    dob: '', city_of_birth: '', country_of_birth: '',
    passport_no: '', passport_issue_date: '', passport_place_of_issue: '',
    address: '', postal_code: '', mobile: '', landline: '',
    email: '', alternative_email: '',
    country: '', course: '',
    source_inquiry: '', status: 'Active'
  });

  const [emergencyContact, setEmergencyContact] = useState({ ...emptyEmergencyContact });

  const [familyDetails, setFamilyDetails] = useState([
    emptyFamilyMember('Father'),
    emptyFamilyMember('Mother'),
    emptyFamilyMember('Sponsor'),
  ]);

  // Sponsor / Emergency relation type: 'Father' | 'Mother' | 'Guardian'
  const [sponsorRelationType, setSponsorRelationType] = useState('Guardian');
  const [emergencyRelationType, setEmergencyRelationType] = useState('Guardian');

  const [educationEntries, setEducationEntries]   = useState([]);
  const [activities, setActivities]               = useState([]);
  const [awards, setAwards]                       = useState([]);
  const [workExperiences, setWorkExperiences]     = useState([]);
  const [intendedPrograms, setIntendedPrograms]   = useState([]);
  const [passportNumbers, setPassportNumbers]     = useState(['']);
  const [documents, setDocuments]                 = useState([]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [assignedCounselors, setAssignedCounselors] = useState([]);
  const [meetings, setMeetings]                   = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);

  const [leadOrigin, setLeadOrigin] = useState(null);
  const [leadFollowUpHistory, setLeadFollowUpHistory] = useState([]);
  const [leadChangeHistory, setLeadChangeHistory] = useState([]);
  const [leadHistoryLoading, setLeadHistoryLoading] = useState(true);

  // Manual form
  const [manualForm, setManualForm]                   = useState(null);
  const [showManualFormModal, setShowManualFormModal] = useState(false);
  const [uploadingManualForm, setUploadingManualForm] = useState(false);
  const [manualFormFile, setManualFormFile]           = useState(null);

  // Counselors
  const [allCounselors, setAllCounselors]           = useState([]);
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [counselorSearchTerm, setCounselorSearchTerm] = useState('');
  const [assigningCounselor, setAssigningCounselor] = useState(false);

  // Meeting
  const [showMeetingModal, setShowMeetingModal]               = useState(false);
  const [selectedCounselorForMeeting, setSelectedCounselorForMeeting] = useState(null);

  // Document upload modal
  const [uploadingDocument, setUploadingDocument]   = useState(false);
  const [showDocumentModal, setShowDocumentModal]   = useState(false);
  const [uploadingDocSlot, setUploadingDocSlot]     = useState(null);
  const [customDocName, setCustomDocName]           = useState('');
  const [docFile, setDocFile]                       = useState(null);
  const [docFiles, setDocFiles]                     = useState([]); // multi-file for Passport

  // ---- Effects ----
  useEffect(() => {
    if (id) {
      fetchStudentData();
      fetchManualForm();
      fetchCountries();
      fetchStudentApplications();
      fetchLeadHistory();
    }
  }, [id]);

  useEffect(() => { if (showCounselorModal) fetchAllCounselors(); }, [showCounselorModal]);

  useEffect(() => {
    if (showApplicationModal) {
      fetchExistingApplications();
      setSelectedUniversityIds([]);
      setExpandedCountries([...assignedCountryIds.map(id => String(id))]);
    }
  }, [showApplicationModal]);

  useEffect(() => {
    if (showAssignCountriesModal) {
      setTempSelectedCountryIds([...assignedCountryIds]);
      setCountrySearchTerm('');
    }
  }, [showAssignCountriesModal]);

  useEffect(() => {
    if (assignedCountryIds.length > 0) {
      fetchUniversitiesForAssignedCountries();
    }
  }, [assignedCountryIds]);

  // Auto-fill sponsor / emergency from Father, Mother, or Sponsor when selected
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

  // ---- Fetchers ----
  const fetchExistingApplications = async () => {
    try {
      const res  = await fetch(`${API_URL}/applications/student/${id}`);
      const data = await res.json();
      if (data.success) setExistingApplications(data.applications);
    } catch (err) { console.error(err); }
  };

  const fetchLeadHistory = async () => {
    setLeadHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/students/${id}/lead-history`);
      const data = await res.json();
      if (data.success && data.hasHistory) {
        setLeadOrigin(data.lead);
        setLeadFollowUpHistory(data.followUps || []);
        setLeadChangeHistory(data.changes || []);
      } else {
        setLeadOrigin(null);
        setLeadFollowUpHistory([]);
        setLeadChangeHistory([]);
      }
    } catch (err) {
      console.error('Error fetching lead history:', err);
    } finally {
      setLeadHistoryLoading(false);
    }
  };

  const fetchStudentApplications = async () => {
    try {
      const res  = await fetch(`${API_URL}/applications/student/${id}`);
      const data = await res.json();
      if (data.success) setStudentApplications(data.applications);
    } catch (err) { console.error(err); }
  };

  const fetchCountries = async () => {
    try {
      const res  = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      if (data.success) setAllCountries(data.countries.filter(c => c.status === 'Active'));
    } catch (err) { console.error(err); }
  };

  const fetchUniversitiesForAssignedCountries = async () => {
    if (assignedCountryIds.length === 0) return;
    setLoadingUniversities(true);
    try {
      const results = {};
      await Promise.all(
        assignedCountryIds.map(async (countryId) => {
          const res  = await fetch(`${API_URL}/universities/by-country/${countryId}`);
          const data = await res.json();
          if (data.success) {
            results[String(countryId)] = data.universities.filter(u => u.status === 'Active' || !u.status);
          } else {
            results[String(countryId)] = [];
          }
        })
      );
      setUniversitiesByCountry(results);
    } catch (err) {
      console.error('Error fetching universities:', err);
    } finally {
      setLoadingUniversities(false);
    }
  };

  const fetchStudentData = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/students/${id}`);
      const data = await res.json();
      if (data.success) {
        setStudentData({
          ...data.student,
          source_inquiry: normalizeSourceInquiry(data.student?.source_inquiry),
        });
        setPassportNumbers(parsePassportNumbers(data.student?.passport_no));
        setProfilePictureFile(null);
        setProfilePicturePreview(data.student?.profile_picture ? `${API_URL}${data.student.profile_picture}` : '');
        setEducationEntries((data.education || []).map(normalizeEducationEntry));
        setWorkExperiences((data.workExperience || []).map(normalizeWorkEntry));
        setIntendedPrograms((data.intendedPrograms || []).map(normalizeIntendedProgram));
        setDocuments(data.documents || []);
        setAssignedCounselors(data.assignedCounselors || []);
        setMeetings(data.meetings || []);

        if (data.emergencyContact) {
          setEmergencyContact(data.emergencyContact);
          const rel = (data.emergencyContact.relation || '').toLowerCase();
          if (rel === 'father') setEmergencyRelationType('Father');
          else if (rel === 'mother') setEmergencyRelationType('Mother');
          else setEmergencyRelationType('Guardian');
        }
        if (data.familyDetails && data.familyDetails.length > 0) {
          const father  = data.familyDetails.find(f => f.type === 'Father')  || emptyFamilyMember('Father');
          const mother  = data.familyDetails.find(f => f.type === 'Mother')  || emptyFamilyMember('Mother');
          const sponsor = data.familyDetails.find(f => f.type === 'Sponsor') || emptyFamilyMember('Sponsor');
          setFamilyDetails([father, mother, sponsor]);

          // Detect sponsor relation type from saved data
          if (sponsor && sponsor.relation) {
            const rel = sponsor.relation.toLowerCase();
            if (rel === 'father') setSponsorRelationType('Father');
            else if (rel === 'mother') setSponsorRelationType('Mother');
            else setSponsorRelationType('Guardian');
          }
        }
        if (data.activities)  setActivities(data.activities);
        if (data.awards)      setAwards(data.awards);
      } else {
        setError(data.message || 'Failed to fetch student data');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection.');
    } finally { setLoading(false); }
  };

  // Resolve country IDs from names
  useEffect(() => {
    if (allCountries.length > 0 && studentData.country) {
      const names = studentData.country.split(',').map(n => n.trim()).filter(Boolean);
      const ids = names
        .map(name => allCountries.find(c => c.country_name === name))
        .filter(Boolean)
        .map(c => c.id);
      setAssignedCountryIds(ids);
    } else if (allCountries.length > 0 && !studentData.country) {
      setAssignedCountryIds([]);
    }
  }, [allCountries, studentData.country]);

  // Backfill from originating lead when registration missed mapped fields
  useEffect(() => {
    if (!leadOrigin) return;
    setStudentData(prev => {
      const next = { ...prev };
      let changed = false;
      if (!prev.source_inquiry?.trim() && leadOrigin.referred_by) {
        next.source_inquiry = normalizeSourceInquiry(leadOrigin.referred_by);
        changed = true;
      }
      if (!prev.course?.trim() && (leadOrigin.course || leadOrigin.program)) {
        next.course = leadOrigin.course || leadOrigin.program;
        changed = true;
      }
      if (!prev.country?.trim()) {
        const names = resolveLeadCountryNames(leadOrigin.countries_of_interest, leadOrigin.countries_other);
        if (names.length) {
          next.country = names.join(', ');
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [leadOrigin]);

  const fetchManualForm = async () => {
    try {
      const res  = await fetch(`${API_URL}/students/${id}/manual-form`);
      const data = await res.json();
      if (data.success && data.manualForm) setManualForm(data.manualForm);
    } catch (err) { console.error(err); }
  };

  const fetchAllCounselors = async () => {
    try {
      const res  = await fetch(`${API_URL}/counselors`);
      const data = await res.json();
      if (data.success) setAllCounselors(data.counselors);
    } catch (err) { console.error(err); }
  };

  // ---- Handlers ----
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

  // Sponsor / Emergency relation type change handlers
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

  // Education
  const addEducation     = () => setEducationEntries(prev => [...prev, emptyEducation()]);
  const removeEducation  = (id) => setEducationEntries(prev => prev.filter(e => e.id !== id));
  const handleEduChange  = (id, field, value) =>
    setEducationEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  // Activities
  const addActivity      = () => setActivities(prev => [...prev, emptyActivity()]);
  const removeActivity   = (id) => setActivities(prev => prev.filter(a => a.id !== id));
  const handleActChange  = (id, field, value) =>
    setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  // Awards
  const addAward         = () => setAwards(prev => [...prev, emptyAward()]);
  const removeAward      = (id) => setAwards(prev => prev.filter(a => a.id !== id));
  const handleAwardChange = (id, field, value) =>
    setAwards(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  // Work Experience
  const addWork          = () => setWorkExperiences(prev => [...prev, emptyWork()]);
  const removeWork       = (id) => setWorkExperiences(prev => prev.filter(w => w.id !== id));
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

  // ---- Assign Countries Modal ----
  const handleTempCountryToggle = (countryId) => {
    setTempSelectedCountryIds(prev =>
      prev.includes(countryId) ? prev.filter(i => i !== countryId) : [...prev, countryId]
    );
  };

  const handleSaveAssignedCountries = async () => {
    setSavingCountries(true);
    try {
      const names = tempSelectedCountryIds
        .map(cid => allCountries.find(c => c.id === cid))
        .filter(Boolean)
        .map(c => c.country_name)
        .join(', ');

      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:    studentData.name,
          middleName:   studentData.middle_name,
          surname:      studentData.surname,
          email:        studentData.email,
          alternativeEmail: studentData.alternative_email,
          mobile:       studentData.mobile,
          landline:     studentData.landline,
          address:      studentData.address,
          postalCode:   studentData.postal_code,
          country:      names,
          dob:          studentData.dob,
          nationality:  studentData.nationality,
          maritalStatus: studentData.marital_status,
          gender:       studentData.gender,
          cityOfBirth:  studentData.city_of_birth,
          countryOfBirth: studentData.country_of_birth,
          passportNo:   serializePassportNumbers(passportNumbers),
          passportIssueDate: studentData.passport_issue_date,
          passportPlaceOfIssue: studentData.passport_place_of_issue,
          guardianName:     studentData.guardian_name,
          guardianRelation: studentData.guardian_relation,
          guardianMobile:   studentData.guardian_mobile,
          guardianEmail:    studentData.guardian_email,
          sourceInquiry: studentData.source_inquiry,
          status:        studentData.status,
          course:        studentData.course,
          emergencyContact,
          familyDetails,
          education:    educationEntries,
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
        setStudentData(prev => ({ ...prev, country: names }));
        setAssignedCountryIds([...tempSelectedCountryIds]);
        setShowAssignCountriesModal(false);
      } else {
        alert(data.message || 'Failed to save countries');
      }
    } catch (err) {
      alert('Network error. Please check your connection.');
    } finally {
      setSavingCountries(false);
    }
  };

  // Submit (main form save)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return;
    setSaving(true); setError('');

    const hasPicture = !!(profilePictureFile || studentData.profile_picture || profilePicturePreview);
    if (!hasPicture) {
      setError('Personal picture is required. Please upload a photo at the top of the form.');
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const countryNames = assignedCountryIds
      .map(cid => allCountries.find(c => c.id === cid))
      .filter(Boolean)
      .map(c => c.country_name)
      .join(', ');

    try {
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        const picRes = await fetch(`${API_URL}/students/${id}/profile-picture`, {
          method: 'POST',
          body: formData
        });
        const picData = await picRes.json();
        if (!picData.success) {
          setError(picData.message || 'Failed to upload personal picture');
          setSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setStudentData(prev => ({ ...prev, profile_picture: picData.profilePicture }));
        setProfilePicturePreview(`${API_URL}${picData.profilePicture}`);
        setProfilePictureFile(null);
      }

      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:    studentData.name,
          middleName:   studentData.middle_name,
          surname:      studentData.surname,
          email:        studentData.email,
          alternativeEmail: studentData.alternative_email,
          mobile:       studentData.mobile,
          landline:     studentData.landline,
          address:      studentData.address,
          postalCode:   studentData.postal_code,
          country:      countryNames || studentData.country,
          dob:          studentData.dob,
          nationality:  studentData.nationality,
          maritalStatus: studentData.marital_status,
          gender:       studentData.gender,
          cityOfBirth:  studentData.city_of_birth,
          countryOfBirth: studentData.country_of_birth,
          passportNo:   serializePassportNumbers(passportNumbers),
          passportIssueDate: studentData.passport_issue_date,
          passportPlaceOfIssue: studentData.passport_place_of_issue,
          guardianName:     studentData.guardian_name,
          guardianRelation: studentData.guardian_relation,
          guardianMobile:   studentData.guardian_mobile,
          guardianEmail:    studentData.guardian_email,
          sourceInquiry: studentData.source_inquiry,
          status:        studentData.status,
          course:        studentData.course,
          emergencyContact,
          familyDetails,
          education:    educationEntries,
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
        alert('Student updated successfully!');
        navigate('/students');
      } else {
        setError(data.message || 'Failed to update student');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setSaving(false); }
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

  // Manual form
  const handleManualFormUpload = async (e) => {
    e.preventDefault();
    if (!manualFormFile) { alert('Please select a file'); return; }
    setUploadingManualForm(true);
    try {
      const formData = new FormData();
      formData.append('manualForm', manualFormFile);
      const res  = await fetch(`${API_URL}/students/${id}/manual-form`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        alert('Manual form uploaded successfully');
        setShowManualFormModal(false); setManualFormFile(null); fetchManualForm();
      } else { alert(data.message || 'Failed to upload'); }
    } catch (err) { alert('Network error.'); }
    finally { setUploadingManualForm(false); }
  };

  const handleDeleteManualForm = async () => {
    if (!window.confirm('Delete this manual form?')) return;
    try {
      const res  = await fetch(`${API_URL}/students/${id}/manual-form`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { alert('Deleted'); setManualForm(null); }
      else alert(data.message || 'Failed');
    } catch (err) { alert('Network error.'); }
  };

  // Document upload
  const openDocumentUpload = (slot) => {
    setUploadingDocSlot(slot);
    setCustomDocName('');
    setDocFile(null);
    setDocFiles([]);
    setShowDocumentModal(true);
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    const docName = uploadingDocSlot ? uploadingDocSlot.name : customDocName.trim();
    const docType = uploadingDocSlot ? uploadingDocSlot.type : 'Other';
    const order   = uploadingDocSlot ? uploadingDocSlot.order : 99;
    const isPassport = uploadingDocSlot?.name === 'Passport';
    const filesToUpload = isPassport
      ? (docFiles.length ? docFiles : (docFile ? [docFile] : []))
      : (docFile ? [docFile] : []);

    if (!filesToUpload.length || !docName) {
      alert(isPassport
        ? 'Please select one or more files to upload'
        : 'Please select a file and provide a document name');
      return;
    }
    setUploadingDocument(true);
    try {
      let uploadedCount = 0;
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentName', docName);
        formData.append('documentType', docType);
        formData.append('displayOrder', order);

        const res  = await fetch(`${API_URL}/students/${id}/documents`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || `Failed to upload ${file.name}`);
          break;
        }
        uploadedCount += 1;
      }
      if (uploadedCount > 0) {
        alert(uploadedCount === 1
          ? 'Document uploaded successfully'
          : `${uploadedCount} documents uploaded successfully`);
        setShowDocumentModal(false);
        setDocFile(null);
        setDocFiles([]);
        setUploadingDocSlot(null);
        setCustomDocName('');
        fetchStudentData();
      }
    } catch (err) { alert('Network error.'); }
    finally { setUploadingDocument(false); }
  };

  const handleToggleVerified = async (documentId, currentStatus) => {
    try {
      const res  = await fetch(`${API_URL}/students/${id}/documents/${documentId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentStatus })
      });
      const data = await res.json();
      if (data.success) fetchStudentData();
      else alert(data.message || 'Failed');
    } catch (err) { alert('Network error.'); }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res  = await fetch(`${API_URL}/students/${id}/documents/${documentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { alert('Deleted'); fetchStudentData(); }
      else alert(data.message || 'Failed');
    } catch (err) { alert('Network error.'); }
  };

  // Counselor
  const handleAssignCounselor = async (counselorId) => {
    setAssigningCounselor(true);
    try {
      const res  = await fetch(`${API_URL}/students/${id}/assign-counselor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counselorId })
      });
      const data = await res.json();
      if (data.success) { alert('Counselor assigned!'); fetchStudentData(); setShowCounselorModal(false); }
      else alert(data.message || 'Failed');
    } catch (err) { alert('Network error.'); }
    finally { setAssigningCounselor(false); }
  };

  const handleRemoveCounselor = async (counselorId) => {
    if (!window.confirm('Remove this counselor?')) return;
    try {
      const res  = await fetch(`${API_URL}/students/${id}/counselors/${counselorId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { alert('Removed'); fetchStudentData(); }
      else alert(data.message || 'Failed');
    } catch (err) { alert('Network error.'); }
  };

  // ---- Application Modal — University Selection ----
  const toggleUniversitySelection = (universityId) => {
    const sid = String(universityId);
    setSelectedUniversityIds(prev =>
      prev.includes(sid) ? prev.filter(i => i !== sid) : [...prev, sid]
    );
  };

  const toggleCountryExpanded = (countryId) => {
    const cid = String(countryId);
    setExpandedCountries(prev =>
      prev.includes(cid) ? prev.filter(i => i !== cid) : [...prev, cid]
    );
  };

  const isUniversityAlreadyApplied = (universityId) =>
    existingApplications.some(app => app.university_id === universityId || String(app.university_id) === String(universityId));

  const getNewApplicationCount = () =>
    selectedUniversityIds.filter(uid => !isUniversityAlreadyApplied(uid)).length;

  const handleCreateApplications = async () => {
    const newSelections = selectedUniversityIds.filter(uid => !isUniversityAlreadyApplied(uid));
    if (newSelections.length === 0) { alert('Please select at least one university that does not already have an application'); return; }

    setCreatingApplications(true);
    try {
      const res  = await fetch(`${API_URL}/students/${id}/create-applications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universityIds: newSelections })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully created ${data.createdCount} application(s)!`);
        setShowApplicationModal(false);
        setSelectedUniversityIds([]);
        fetchStudentApplications();
        if (window.confirm('View applications?')) navigate('/applications');
      } else alert(data.message || 'Failed');
    } catch (err) { alert('Network error.'); }
    finally { setCreatingApplications(false); }
  };

  const filteredCounselors = allCounselors.filter(c => {
    const assigned = assignedCounselors.some(ac => ac.id === c.id);
    const match = c.name.toLowerCase().includes(counselorSearchTerm.toLowerCase()) ||
                  c.email.toLowerCase().includes(counselorSearchTerm.toLowerCase()) ||
                  c.counselor_id.toLowerCase().includes(counselorSearchTerm.toLowerCase());
    return !assigned && match;
  });

  const filteredAssignCountries = allCountries.filter(c =>
    c.country_name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const assignedCountryObjects = allCountries.filter(c => assignedCountryIds.includes(c.id));

  const getMeetingStatusColor = (status) => ({
    'Scheduled': 'meeting-scheduled', 'Completed': 'meeting-completed', 'Cancelled': 'meeting-cancelled'
  }[status] || 'meeting-scheduled');

  const getDocForSlot = (slotName) => documents.find(d => d.document_name === slotName);
  const getDocsForSlot = (slotName) => documents.filter(d => d.document_name === slotName);

  const getApplicationStatusColor = (status) => {
    const map = {
      'In Progress': { bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
      'Pending':   { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' },
      'Approved':  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
      'Accepted':  { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
      'Rejected':  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
      'Withdrawn': { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
      'Closed':    { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
    };
    return map[status] || map['Pending'];
  };

  if (loading) {
    return (
      <ViewModeWrap viewOnly={viewOnly}><Sidebar />
        <div className="main-content" id="mainContent"><Header />
          <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading student data...</p></div>
        </div>
      </ViewModeWrap>
    );
  }

  // ---- Section style helpers ----
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
    <ViewModeWrap viewOnly={viewOnly}>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="students-container">

          {/* Page Header */}
          <div className="students-header">
            <div className="header-left">
              <h1>
                <FontAwesomeIcon icon={faUserGraduate} className="page-icon" />
                {viewOnly ? 'Student Details' : 'Edit Student'}
              </h1>
            </div>
            <div className="header-right">
              <button type="button" className="btn-primary"
                onClick={() => setShowAssignCountriesModal(true)} style={{ marginRight: '10px' }}>
                <FontAwesomeIcon icon={faGlobe} /> Assign Countries
              </button>
              <button type="button" className="btn-primary"
                onClick={() => setShowApplicationModal(true)} style={{ marginRight: '10px' }}>
                Assign To Application
              </button>
              <button type="button" className="btn-primary"
                onClick={() => setShowManualFormModal(true)} style={{ marginRight: '10px' }}>
                <FontAwesomeIcon icon={faFileUpload} /> Upload Manual Form
              </button>
              <button type="button" className="btn-primary"
                onClick={() => setShowCounselorModal(true)}>
                <FontAwesomeIcon icon={faUserTie} /> Assign Counselor
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

          {/* Manual Form Banner */}
          {manualForm && (
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px', borderRadius: '12px', marginBottom: '24px', color: 'white' }}>
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '32px' }} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Manual Form Uploaded</h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                        Uploaded on: {new Date(manualForm.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-right">
                  <a href={`${API_URL}${manualForm.filePath}`} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ marginRight: '10px', background: 'white', color: '#667eea' }}>
                    <FontAwesomeIcon icon={faDownload} /> Download
                  </a>
                  <button type="button" className="btn-icon btn-delete" onClick={handleDeleteManualForm}
                    style={{ background: '#dc2626', color: 'white' }}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student ID Card */}
          <div className="student-id-card">
            <div className="row align-items-center">
              <div className="col-md-6">
                <span className="id-label">Student ID:</span>
                <span className="student-id-display">{studentData.student_id}</span>
              </div>
              <div className="col-md-6 text-right">
                <span className={`status-badge ${studentData.status === 'Active' ? 'active' : 'inactive'}`}>
                  {studentData.status}
                </span>
              </div>
            </div>
          </div>

          {!leadHistoryLoading && leadOrigin && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  <FontAwesomeIcon icon={faHistory} style={{ color: '#F47B20' }} />
                  Lead &amp; Follow-up History
                </h2>
                <Link to={`/edit-lead/${leadOrigin.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                  View Full Lead Record
                </Link>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px', marginBottom: '20px'
              }}>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>First became a lead</div>
                  <div style={{ fontWeight: '700', color: '#111827' }}>
                    {leadOrigin.created_at ? new Date(leadOrigin.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total follow-ups</div>
                  <div style={{ fontWeight: '700', color: '#F47B20' }}>{leadFollowUpHistory.length}</div>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Registered as student</div>
                  <div style={{ fontWeight: '700', color: '#111827' }}>
                    {leadOrigin.registered_at ? new Date(leadOrigin.registered_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Original lead ID</div>
                  <div style={{ fontWeight: '700', color: '#111827' }}>LEAD{String(leadOrigin.id).padStart(5, '0')}</div>
                </div>
              </div>

              {leadFollowUpHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table meeting-history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Follow-up Date</th>
                        <th>Notes</th>
                        <th>Purpose Of Visit</th>
                        <th>Changes Made</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadFollowUpHistory.map((followUp) => {
                        const relatedChanges = leadChangeHistory.filter(c => c.follow_up_id === followUp.id);
                        return (
                          <tr key={followUp.id}>
                            <td>
                              <span style={{ background: '#F47B20', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                #{followUp.follow_up_number}
                              </span>
                            </td>
                            <td>{new Date(followUp.followed_up_at).toLocaleString()}</td>
                            <td>{followUp.notes || 'No notes'}</td>
                            <td>{followUp.purpose_of_visit || 'No purpose specified'}</td>
                            <td>
                              {relatedChanges.length > 0 ? (
                                <div style={{ fontSize: '13px' }}>
                                  {relatedChanges.map((change, idx) => (
                                    <div key={idx} style={{ marginBottom: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #F47B20', borderRadius: '4px' }}>
                                      <strong style={{ textTransform: 'capitalize', color: '#F47B20' }}>{change.field_name.replace(/_/g, ' ')}:</strong>
                                      <br />
                                      <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{change.old_value || '(empty)'}</span>
                                      {' → '}
                                      <span style={{ color: '#16a34a', fontWeight: '500' }}>{change.new_value || '(empty)'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No changes recorded</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data-message">
                  <FontAwesomeIcon icon={faHistory} className="no-data-icon" />
                  <p>No follow-up visits were recorded before registration.</p>
                </div>
              )}
            </div>
          )}

          <form className="student-form" onSubmit={handleSubmit}>

            {/* ======================================================
                SECTION 1: APPLICANT'S INFORMATION
            ====================================================== */}
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
                      value={studentData.dob ? studentData.dob.split('T')[0] : ''}
                      onChange={handleInputChange} required />
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
                    <input
                      type="text"
                      name="country_of_birth"
                      className="input-field form-control"
                      value={studentData.country_of_birth || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Pakistan"
                    />
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
                      value={studentData.passport_issue_date ? studentData.passport_issue_date.split('T')[0] : ''}
                      onChange={handleInputChange} />
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

            {/* ======================================================
                SECTION 2: PARENTS DETAILS
            ====================================================== */}
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

            {/* ======================================================
                SECTION 3: SPONSOR / GUARDIAN
            ====================================================== */}
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

            {/* ======================================================
                SECTION 4: EMERGENCY CONTACT
            ====================================================== */}
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

            {/* ======================================================
                SECTION 7: EDUCATION HISTORY
            ====================================================== */}
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

              {/* Co-curricular Activities */}
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

              {/* Awards */}
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

            {/* ======================================================
                SECTION 7: WORK EXPERIENCE
            ====================================================== */}
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

            {/* ======================================================
                INTENDED PROGRAM OF STUDY
            ====================================================== */}
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
                      {[...new Set([studentData.intake_year, ...INTAKE_YEAR_OPTIONS].filter(Boolean))].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================
                SECTION 8: DOCUMENTS UPLOAD
            ====================================================== */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                  Documents Upload
                </h2>
                <button type="button" className="btn-primary btn-sm"
                  onClick={() => openDocumentUpload(null)}>
                  <FontAwesomeIcon icon={faPlus} /> Upload Other Document
                </button>
              </div>

              <div className="row g-3">
                {PREDEFINED_DOCS.map((slot) => {
                  const isPassport = slot.name === 'Passport';
                  const uploadedList = isPassport ? getDocsForSlot(slot.name) : [];
                  const uploaded = isPassport ? null : getDocForSlot(slot.name);
                  const hasFiles = isPassport ? uploadedList.length > 0 : !!uploaded;

                  return (
                    <div key={slot.name} className="col-md-6">
                      <div style={{
                        border: hasFiles ? '2px solid #22c55e' : '2px dashed #d1d5db',
                        borderRadius: '12px', padding: '18px', background: hasFiles ? '#f0fdf4' : '#fafafa',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <FontAwesomeIcon
                                icon={hasFiles ? faCheckCircle : faFileAlt}
                                style={{ color: hasFiles ? '#22c55e' : '#9ca3af', fontSize: '20px' }}
                              />
                              <span style={{ fontWeight: '600', fontSize: '14px', color: hasFiles ? '#166534' : '#374151' }}>
                                {slot.name}
                                {isPassport && uploadedList.length > 0 && (
                                  <span style={{ fontWeight: 500, color: '#6b7280', marginLeft: '6px' }}>
                                    ({uploadedList.length})
                                  </span>
                                )}
                              </span>
                            </div>

                            {isPassport ? (
                              uploadedList.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {uploadedList.map((doc, idx) => (
                                    <div key={doc.id} style={{
                                      background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px',
                                      padding: '8px 10px', display: 'flex', justifyContent: 'space-between',
                                      alignItems: 'center', gap: '8px'
                                    }}>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>
                                          File #{idx + 1}
                                        </div>
                                        <span style={{
                                          display: 'inline-block', padding: '2px 8px',
                                          background: doc.verified ? '#dcfce7' : '#fef9c3',
                                          color: doc.verified ? '#166534' : '#854d0e',
                                          borderRadius: '20px', fontSize: '11px', marginTop: '4px'
                                        }}>
                                          {doc.verified ? 'Verified' : 'Not Verified'}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        <label className="toggle-switch" style={{ margin: 0 }}>
                                          <input type="checkbox" checked={!!doc.verified}
                                            onChange={() => handleToggleVerified(doc.id, doc.verified)} />
                                          <span className="toggle-slider"></span>
                                        </label>
                                        <a href={`${API_URL}${doc.file_path}`} target="_blank" rel="noopener noreferrer"
                                          className="btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                          <FontAwesomeIcon icon={faDownload} />
                                        </a>
                                        <button type="button" className="btn-icon btn-delete"
                                          onClick={() => handleDeleteDocument(doc.id)}
                                          style={{ width: '28px', height: '28px' }}>
                                          <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>
                                  No passport files uploaded yet — you can upload multiple
                                </p>
                              )
                            ) : uploaded ? (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                <span style={{
                                  display: 'inline-block', padding: '2px 8px',
                                  background: uploaded.verified ? '#dcfce7' : '#fef9c3',
                                  color: uploaded.verified ? '#166534' : '#854d0e',
                                  borderRadius: '20px', fontSize: '11px', marginBottom: '8px'
                                }}>
                                  {uploaded.verified ? 'Verified' : 'Not Verified'}
                                </span>
                              </div>
                            ) : (
                              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>
                                No file uploaded yet
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                            {isPassport ? (
                              <button type="button"
                                onClick={() => openDocumentUpload(slot)}
                                className="btn-primary btn-sm" style={{ fontSize: '12px' }}>
                                <FontAwesomeIcon icon={faUpload} /> {uploadedList.length ? 'Add More' : 'Upload'}
                              </button>
                            ) : uploaded ? (
                              <>
                                <label className="toggle-switch" style={{ margin: '0 0 4px' }}>
                                  <input type="checkbox" checked={uploaded.verified}
                                    onChange={() => handleToggleVerified(uploaded.id, uploaded.verified)} />
                                  <span className="toggle-slider"></span>
                                </label>
                                <a href={`${API_URL}${uploaded.file_path}`} target="_blank" rel="noopener noreferrer"
                                  className="btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>
                                  <FontAwesomeIcon icon={faDownload} /> View
                                </a>
                                <button type="button"
                                  onClick={() => openDocumentUpload(slot)}
                                  className="btn-primary btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>
                                  <FontAwesomeIcon icon={faCloudUploadAlt} /> Replace
                                </button>
                                <button type="button" className="btn-icon btn-delete"
                                  onClick={() => handleDeleteDocument(uploaded.id)}
                                  style={{ width: '28px', height: '28px' }}>
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </>
                            ) : (
                              <button type="button"
                                onClick={() => openDocumentUpload(slot)}
                                className="btn-primary btn-sm" style={{ fontSize: '12px' }}>
                                <FontAwesomeIcon icon={faUpload} /> Upload
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {documents
                  .filter(d => !PREDEFINED_DOCS.find(s => s.name === d.document_name))
                  .map(doc => (
                    <div key={doc.id} className="col-md-6">
                      <div className="document-card">
                        <div className="document-header">
                          <div>
                            <h4>{doc.document_name}</h4>
                            <span className="document-type">{doc.document_type}</span>
                          </div>
                          <div className="toggle-wrapper">
                            <label className="toggle-switch">
                              <input type="checkbox" checked={doc.verified}
                                onChange={() => handleToggleVerified(doc.id, doc.verified)} />
                              <span className="toggle-slider"></span>
                            </label>
                            <span className="toggle-label">{doc.verified ? 'Verified' : 'Not Verified'}</span>
                          </div>
                        </div>
                        <div className="document-actions">
                          <a href={`${API_URL}${doc.file_path}`} target="_blank" rel="noopener noreferrer"
                            className="btn-secondary btn-sm">
                            <FontAwesomeIcon icon={faDownload} /> Download
                          </a>
                          <button type="button" className="btn-icon btn-delete"
                            onClick={() => handleDeleteDocument(doc.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Link to="/students" className="btn-secondary">Cancel</Link>
              <button type="submit" className="btn-primary" disabled={saving}>
                <FontAwesomeIcon icon={faSave} />
                {saving ? 'Updating...' : 'Update Student'}
              </button>
            </div>
          </form>

          {/* ======================================================
              ASSIGNED COUNTRIES (outside form)
          ====================================================== */}
          <div style={{ ...sectionStyle, marginTop: '24px' }}>
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

          {/* ======================================================
              ASSIGNED COUNSELORS (outside form)
          ====================================================== */}
          <div style={{ ...sectionStyle, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20' }} />
                Assigned Counselors
              </h2>
              <button type="button" className="btn-primary btn-sm"
                onClick={() => setShowCounselorModal(true)}>
                <FontAwesomeIcon icon={faPlus} /> Add Counselor
              </button>
            </div>

            {assignedCounselors.length > 0 ? (
              <div className="row g-3">
                {assignedCounselors.map(counselor => (
                  <div key={counselor.id} className="col-md-6">
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{counselor.name}</h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>{counselor.counselor_id}</p>
                        </div>
                        <button type="button" className="btn-icon btn-delete"
                          onClick={() => handleRemoveCounselor(counselor.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        <strong>Email:</strong> {counselor.email}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>
                        <strong>Experience:</strong> {counselor.experience}
                      </div>
                      <button type="button" className="btn-primary" style={{ width: '100%' }}
                        onClick={() => { setSelectedCounselorForMeeting(counselor); setShowMeetingModal(true); }}>
                        <FontAwesomeIcon icon={faCalendarAlt} /> Schedule Meeting
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <FontAwesomeIcon icon={faUserTie} className="no-data-icon" />
                <p>No counselors assigned yet.</p>
              </div>
            )}
          </div>

          {/* Meeting History */}
          {meetings.length > 0 && (
            <div style={{ ...sectionStyle, marginTop: '24px' }}>
              <h2 style={sectionTitleStyle}>
                <FontAwesomeIcon icon={faHistory} /> Meeting History
              </h2>
              <div className="row g-3">
                {meetings.map(meeting => (
                  <div key={meeting.id} className="col-12">
                    <div className="meeting-card">
                      <div className="meeting-header">
                        <div className="meeting-student">
                          <FontAwesomeIcon icon={faUserTie} className="meeting-icon" />
                          <div>
                            <h4>{meeting.counselor_name}</h4>
                            <span className="student-id-small">{meeting.counselor_id}</span>
                          </div>
                        </div>
                        <span className={`meeting-status-badge ${getMeetingStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      <div className="meeting-details">
                        <div className="meeting-info-item">
                          <FontAwesomeIcon icon={faCalendarAlt} className="info-icon-small" />
                          <span>{new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}</span>
                        </div>
                        <div className="meeting-info-item">
                          <FontAwesomeIcon icon={faClock} className="info-icon-small" />
                          <span>{meeting.meeting_time} ({meeting.duration_minutes} minutes)</span>
                        </div>
                      </div>
                      {meeting.notes && <div className="meeting-notes"><strong>Notes:</strong> {meeting.notes}</div>}
                      {meeting.meeting_notes_image && (
                        <div className="meeting-notes" style={{ marginTop: '10px' }}>
                          <strong>Attached Document:</strong>
                          <a href={`${API_URL}${meeting.meeting_notes_image}`} target="_blank" rel="noopener noreferrer"
                            style={{ marginLeft: '10px', color: '#F47B20' }}>
                            <FontAwesomeIcon icon={faImage} /> View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================
              SECTION 9: STUDENT APPLICATIONS (outside form)
          ====================================================== */}
          <div style={{ ...sectionStyle, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={sectionTitleStyle}>
                <FontAwesomeIcon icon={faGraduationCap} style={{ color: '#F47B20' }} />
                Applications
              </h2>
            </div>

            {studentApplications.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>
                        Application ID
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Country
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        University
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Program
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentApplications.map((app, index) => {
                      const statusStyle = getApplicationStatusColor(app.application_status);
                      return (
                        <tr key={app.id} style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: index % 2 === 0 ? 'white' : '#fafafa',
                          transition: 'background 0.15s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                          onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa'}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontWeight: '700', color: '#F47B20', fontFamily: 'monospace',
                              fontSize: '13px', letterSpacing: '0.5px'
                            }}>
                              {app.application_id}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FontAwesomeIcon icon={faGlobe} style={{ color: '#9ca3af', fontSize: '13px' }} />
                              <span style={{ color: '#111827', fontWeight: '500' }}>
                                {app.country_name || '—'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FontAwesomeIcon icon={faUniversity} style={{ color: '#9ca3af', fontSize: '13px' }} />
                              <span style={{ color: '#374151' }}>
                                {app.university_name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not assigned</span>}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#374151' }}>
                            {app.program || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                              fontSize: '12px', fontWeight: '600',
                              background: statusStyle.bg, color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`
                            }}>
                              {app.application_status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <Link
                              to={`/edit-application/${app.id}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', background: '#F47B20', color: 'white',
                                borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                textDecoration: 'none', transition: 'background 0.15s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#d96a0f'}
                              onMouseLeave={e => e.currentTarget.style.background = '#F47B20'}
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '11px' }} />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <FontAwesomeIcon icon={faGraduationCap} className="no-data-icon"
                  style={{ opacity: 0.25, fontSize: '36px', display: 'block', marginBottom: '10px' }} />
                <p>No applications found for this student. Click <strong>Create Application</strong> to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Assign Countries Modal */}
      {showAssignCountriesModal && (
        <>
          <div className="modal-backdrop show"
            onClick={() => !savingCountries && setShowAssignCountriesModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '10px' }} />
                    Assign Countries
                  </h5>
                  <button type="button" className="btn-close-modal"
                    onClick={() => setShowAssignCountriesModal(false)}
                    disabled={savingCountries}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>
                    Select countries this student is interested in. These will be used when creating applications.
                  </p>
                  {/* Search */}
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
                    onClick={() => setShowAssignCountriesModal(false)}
                    disabled={savingCountries}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary"
                    onClick={handleSaveAssignedCountries}
                    disabled={savingCountries}>
                    <FontAwesomeIcon icon={faSave} />
                    {savingCountries ? 'Saving...' : 'Save Countries'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload Manual Form Modal */}
      {showManualFormModal && (
        <>
          <div className="modal-backdrop show" onClick={() => !uploadingManualForm && setShowManualFormModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title"><FontAwesomeIcon icon={faFileUpload} style={{ marginRight: '10px' }} />Upload Manual Form</h5>
                  <button type="button" className="btn-close-modal" onClick={() => setShowManualFormModal(false)} disabled={uploadingManualForm}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <form onSubmit={handleManualFormUpload}>
                  <div className="modal-body">
                    <div className="modal-form-group">
                      <label>Select Manual Form <span className="required">*</span></label>
                      <input type="file" className="input-field"
                        onChange={e => setManualFormFile(e.target.files[0])}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required />
                      <small style={{ display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </small>
                      {manualForm && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#fff3cd',
                          border: '1px solid #ffc107', borderRadius: '8px', fontSize: '13px' }}>
                          <strong>Note:</strong> Uploading will replace the existing form.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setShowManualFormModal(false)} disabled={uploadingManualForm}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={uploadingManualForm}>
                      <FontAwesomeIcon icon={faUpload} /> {uploadingManualForm ? 'Uploading...' : 'Upload Form'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <>
          <div className="modal-backdrop show" onClick={() => !uploadingDocument && setShowDocumentModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faUpload} style={{ marginRight: '10px' }} />
                    {uploadingDocSlot ? `Upload: ${uploadingDocSlot.name}` : 'Upload Other Document'}
                  </h5>
                  <button type="button" className="btn-close-modal" onClick={() => setShowDocumentModal(false)} disabled={uploadingDocument}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <form onSubmit={handleDocumentUpload}>
                  <div className="modal-body">
                    <div className="row g-3">
                      {!uploadingDocSlot && (
                        <div className="col-12">
                          <div className="modal-form-group">
                            <label>Document Name <span className="required">*</span></label>
                            <input type="text" className="input-field"
                              value={customDocName}
                              onChange={e => setCustomDocName(e.target.value)}
                              placeholder="e.g. Bank Statement, Reference Letter"
                              required />
                          </div>
                        </div>
                      )}
                      <div className="col-12">
                        <div className="modal-form-group">
                          <label>
                            {uploadingDocSlot?.name === 'Passport' ? 'Select File(s)' : 'Select File'}{' '}
                            <span className="required">*</span>
                          </label>
                          {uploadingDocSlot?.name === 'Passport' ? (
                            <>
                              <input
                                type="file"
                                className="input-field"
                                multiple
                                onChange={e => {
                                  const files = Array.from(e.target.files || []);
                                  setDocFiles(files);
                                  setDocFile(files[0] || null);
                                }}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                required
                              />
                              {docFiles.length > 0 && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#166534' }}>
                                  {docFiles.length} file{docFiles.length > 1 ? 's' : ''} selected:{' '}
                                  {docFiles.map(f => f.name).join(', ')}
                                </div>
                              )}
                              <small style={{ display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                                You can select multiple passport files at once. Accepted: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
                              </small>
                            </>
                          ) : (
                            <>
                              <input type="file" className="input-field"
                                onChange={e => { setDocFile(e.target.files[0]); setDocFiles([]); }}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required />
                              <small style={{ display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                                Accepted: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                              </small>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setShowDocumentModal(false)} disabled={uploadingDocument}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={uploadingDocument}>
                      <FontAwesomeIcon icon={faUpload} /> {uploadingDocument ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Counselor Modal */}
      {showCounselorModal && (
        <>
          <div className="modal-backdrop show" onClick={() => !assigningCounselor && setShowCounselorModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title"><FontAwesomeIcon icon={faUserTie} style={{ marginRight: '10px' }} />Assign Counselor</h5>
                  <button type="button" className="btn-close-modal" onClick={() => setShowCounselorModal(false)} disabled={assigningCounselor}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="search-box mb-3" style={{ position: 'relative' }}>
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input type="text" className="input-field"
                      placeholder="Search by name, email, or ID..."
                      value={counselorSearchTerm} onChange={e => setCounselorSearchTerm(e.target.value)} />
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredCounselors.length > 0 ? (
                      <div className="row g-3">
                        {filteredCounselors.map(c => (
                          <div key={c.id} className="col-12">
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: 'white' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#F47B20'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F47B20',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                      <FontAwesomeIcon icon={faUserTie} />
                                    </div>
                                    <div>
                                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{c.name}</h4>
                                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{c.counselor_id}</p>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#6b7280' }}><strong>Email:</strong> {c.email}</div>
                                </div>
                                <button type="button" className="btn-primary" style={{ marginLeft: '15px' }}
                                  onClick={() => handleAssignCounselor(c.id)} disabled={assigningCounselor}>
                                  <FontAwesomeIcon icon={faPlus} /> {assigningCounselor ? 'Assigning...' : 'Assign'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <FontAwesomeIcon icon={faUserTie} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                        <p>{counselorSearchTerm ? 'No counselors found' : 'All counselors already assigned'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetingModal && selectedCounselorForMeeting && (
        <>
          <div className="modal-backdrop show" onClick={() => setShowMeetingModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '10px' }} />
                    Schedule Meeting with {selectedCounselorForMeeting.name}
                  </h5>
                  <button type="button" className="btn-close-modal" onClick={() => setShowMeetingModal(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <MeetingScheduler
                  counselorId={selectedCounselorForMeeting.id}
                  userId={id}
                  onClose={() => setShowMeetingModal(false)}
                  onSuccess={() => { fetchStudentData(); setShowMeetingModal(false); }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign to Application Modal */}
      {showApplicationModal && (
        <>
          <div className="modal-backdrop show"
            onClick={() => !creatingApplications && setShowApplicationModal(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '10px' }} />
                    Create Applications — Select Universities
                  </h5>
                  <button type="button" className="btn-close-modal"
                    onClick={() => setShowApplicationModal(false)}
                    disabled={creatingApplications}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="modal-body">
                  {assignedCountryIds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        No countries assigned to this student yet.
                        Please use <strong>Assign Countries</strong> first.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                        Select universities to create applications for. Expand each country to see its universities.
                      </p>

                      {existingApplications.length > 0 && (
                        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px',
                          padding: '10px 14px', marginBottom: '16px' }}>
                          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b', marginRight: '8px' }} />
                          <span style={{ fontSize: '13px', color: '#92400e' }}>
                            This student already has {existingApplications.length} application(s). Universities with existing applications are marked below.
                          </span>
                        </div>
                      )}

                      {loadingUniversities ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                          <p>Loading universities...</p>
                        </div>
                      ) : (
                        <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                          {assignedCountryObjects.map(country => {
                            const cid = String(country.id);
                            const universities = universitiesByCountry[cid] || [];
                            const isExpanded = expandedCountries.includes(cid);
                            const selectedInCountry = universities.filter(u =>
                              selectedUniversityIds.includes(String(u.id))
                            ).length;

                            return (
                              <div key={country.id} style={{
                                border: '1px solid #e5e7eb', borderRadius: '12px',
                                marginBottom: '10px', overflow: 'hidden'
                              }}>
                                <div
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 18px', background: isExpanded ? '#fff7ed' : '#f9fafb',
                                    cursor: 'pointer', borderBottom: isExpanded ? '1px solid #fed7aa' : 'none',
                                    transition: 'background 0.15s'
                                  }}
                                  onClick={() => toggleCountryExpanded(country.id)}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FontAwesomeIcon icon={faGlobe} style={{ color: '#F47B20', fontSize: '15px' }} />
                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                                      {country.country_name}
                                    </span>
                                    <span style={{
                                      fontSize: '12px', color: '#6b7280',
                                      background: '#f3f4f6', padding: '2px 8px', borderRadius: '20px'
                                    }}>
                                      {universities.length} {universities.length === 1 ? 'university' : 'universities'}
                                    </span>
                                    {selectedInCountry > 0 && (
                                      <span style={{
                                        fontSize: '12px', color: '#c2440e', fontWeight: '600',
                                        background: '#fff7ed', padding: '2px 8px', borderRadius: '20px',
                                        border: '1px solid #F47B20'
                                      }}>
                                        {selectedInCountry} selected
                                      </span>
                                    )}
                                  </div>
                                  <FontAwesomeIcon
                                    icon={isExpanded ? faChevronUp : faChevronDown}
                                    style={{ color: '#6b7280', fontSize: '13px' }}
                                  />
                                </div>

                                {isExpanded && (
                                  <div style={{ padding: '12px 16px' }}>
                                    {universities.length === 0 ? (
                                      <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                        <FontAwesomeIcon icon={faUniversity} style={{ fontSize: '24px', marginBottom: '8px', display: 'block', opacity: 0.4 }} />
                                        No active universities found for this country
                                      </div>
                                    ) : (
                                      <div className="row g-2">
                                        {universities.map(uni => {
                                          const uid = String(uni.id);
                                          const alreadyApplied = isUniversityAlreadyApplied(uni.id);
                                          const isSelected = selectedUniversityIds.includes(uid);

                                          return (
                                            <div key={uni.id} className="col-md-6">
                                              <div
                                                style={{
                                                  border: alreadyApplied
                                                    ? '1.5px solid #fbbf24'
                                                    : isSelected ? '2px solid #F47B20' : '1px solid #e5e7eb',
                                                  borderRadius: '8px', padding: '12px 14px',
                                                  cursor: alreadyApplied ? 'not-allowed' : 'pointer',
                                                  background: alreadyApplied ? '#fef9c3' : isSelected ? '#fff7ed' : 'white',
                                                  opacity: alreadyApplied ? 0.75 : 1,
                                                  display: 'flex', alignItems: 'center', gap: '10px',
                                                  transition: 'all 0.15s'
                                                }}
                                                onClick={() => !alreadyApplied && toggleUniversitySelection(uni.id)}
                                                onMouseEnter={e => { if (!alreadyApplied && !isSelected) e.currentTarget.style.borderColor = '#F47B20'; }}
                                                onMouseLeave={e => { if (!alreadyApplied && !isSelected) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                              >
                                                <div style={{
                                                  width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                                                  border: alreadyApplied ? '2px solid #fbbf24' : isSelected ? '2px solid #F47B20' : '2px solid #d1d5db',
                                                  background: alreadyApplied ? '#fbbf24' : isSelected ? '#F47B20' : 'white',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                  {(alreadyApplied || isSelected) && (
                                                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'white', fontSize: '10px' }} />
                                                  )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                  <div style={{
                                                    fontWeight: '600', fontSize: '13px',
                                                    color: alreadyApplied ? '#92400e' : isSelected ? '#c2440e' : '#111827',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                  }}>
                                                    {uni.university_name}
                                                  </div>
                                                  {alreadyApplied && (
                                                    <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                                      Application exists
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {getNewApplicationCount() > 0 && (
                        <div style={{ marginTop: '16px', padding: '10px 14px', background: '#f0fdf4',
                          border: '1px solid #86efac', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
                            <strong>{getNewApplicationCount()}</strong> new application(s) will be created
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary"
                    onClick={() => setShowApplicationModal(false)}
                    disabled={creatingApplications}>
                    Cancel
                  </button>
                  {assignedCountryIds.length > 0 && (
                    <button type="button" className="btn-primary"
                      onClick={handleCreateApplications}
                      disabled={creatingApplications || getNewApplicationCount() === 0}>
                      <FontAwesomeIcon icon={faPlus} />
                      {creatingApplications
                        ? 'Creating...'
                        : `Create ${getNewApplicationCount()} Application(s)`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ViewModeWrap>
  );
}