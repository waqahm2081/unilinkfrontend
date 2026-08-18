import React, { useState, useEffect } from 'react'
import '../styles/leads.css'
import CountryMultiSelect from '../components/CountryMultiSelect'
import { REFERRED_BY_OPTIONS } from '../constants/referredByOptions'

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const QUALIFICATION_OPTIONS = [
    'O Level', 'A Level', 'Matriculation', 'Intermediate', 'Graduate', 'Post Graduate'
];

const SUBJECT_GRADE_LEVELS = ['O Level', 'A Level'];
const PERCENTAGE_LEVELS = ['Matriculation', 'Intermediate'];
const CGPA_LEVELS = ['Graduate', 'Post Graduate'];

const PURPOSE_OF_VISIT_OPTIONS = [
    'Initial Consultation',
    'Follow up meeting with the Counsellor',
    'Counselling Meeting (For Registered Students)',
    'Internship',
    'Other'
];

const ADMISSION_TEST_LABELS = {
    ielts: 'IELTS',
    toefl: 'TOEFL',
    sat: 'SAT',
    gre_gmat: 'GRE/GMAT'
};

const DEFAULT_ADMISSION_TESTS = {
    ielts: { attempted: '', score: '', date: '' },
    toefl: { attempted: '', score: '', date: '' },
    sat: { attempted: '', score: '', date: '' },
    gre_gmat: { attempted: '', score: '', date: '' }
};

const emptySubjectRow = () => ({ subject: '', grade: '' });

const emptyQualificationDetails = () => ({
    'O Level': { subjects: [emptySubjectRow()] },
    'A Level': { subjects: [emptySubjectRow()] },
    'Matriculation': { percentage: '' },
    'Intermediate': { percentage: '' },
    'Graduate': { cgpaDivision: '' },
    'Post Graduate': { cgpaDivision: '' }
});

const emptyQualificationsState = () => ({
    selected: [],
    details: emptyQualificationDetails()
});

const emptyFormData = () => ({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    interest: '',
    program: '',
    instituteName: '',
    countriesOfInterest: [],
    countriesOther: '',
    qualifications: emptyQualificationsState(),
    referredBy: '',
    counsellorNotes: '',
    admissionTests: JSON.parse(JSON.stringify(DEFAULT_ADMISSION_TESTS))
});

const normalizeLevelName = (name) => {
    if (!name) return '';
    const map = {
        'O levels': 'O Level', 'O Levels': 'O Level', 'O Level': 'O Level',
        'A levels': 'A Level', 'A Levels': 'A Level', 'A Level': 'A Level',
        'Matric': 'Matriculation', 'Matriculation': 'Matriculation',
        'FSc': 'Intermediate', 'Intermediate': 'Intermediate',
        'Bachelors': 'Graduate', 'Bachelor': 'Graduate', 'Graduate': 'Graduate',
        'Masters': 'Post Graduate', 'Master': 'Post Graduate', 'Post Graduate': 'Post Graduate', 'Postgraduate': 'Post Graduate'
    };
    return map[name] || (QUALIFICATION_OPTIONS.includes(name) ? name : '');
};

const parseQualificationsFromLead = (lead) => {
    const state = emptyQualificationsState();
    let parsed = null;

    if (lead.qualifications) {
        try {
            parsed = typeof lead.qualifications === 'string' ? JSON.parse(lead.qualifications) : lead.qualifications;
        } catch (e) { /* fall through */ }
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
        // New format: [{ level, subjects|percentage|cgpaDivision }]
        if (parsed[0].level || parsed.some(q => q.subjects || q.percentage != null || q.cgpaDivision != null)) {
            parsed.forEach(entry => {
                const level = normalizeLevelName(entry.level || entry.qualification);
                if (!level || !QUALIFICATION_OPTIONS.includes(level)) return;
                if (!state.selected.includes(level)) state.selected.push(level);

                if (SUBJECT_GRADE_LEVELS.includes(level)) {
                    const subjects = Array.isArray(entry.subjects) && entry.subjects.length > 0
                        ? entry.subjects.map(s => ({ subject: s.subject || '', grade: s.grade || '' }))
                        : (entry.subject || entry.grade
                            ? [{ subject: entry.subject || '', grade: entry.grade || '' }]
                            : [emptySubjectRow()]);
                    state.details[level] = { subjects };
                } else if (PERCENTAGE_LEVELS.includes(level)) {
                    state.details[level] = { percentage: entry.percentage || entry.grade || '' };
                } else if (CGPA_LEVELS.includes(level)) {
                    state.details[level] = { cgpaDivision: entry.cgpaDivision || entry.grade || '' };
                }
            });
            return state;
        }

        // Old flat format: [{ qualification, subject, grade }]
        const byLevel = {};
        parsed.forEach(row => {
            const level = normalizeLevelName(row.qualification);
            if (!level) return;
            if (!state.selected.includes(level)) state.selected.push(level);
            if (!byLevel[level]) byLevel[level] = [];
            if (SUBJECT_GRADE_LEVELS.includes(level)) {
                byLevel[level].push({ subject: row.subject || '', grade: row.grade || '' });
            } else if (PERCENTAGE_LEVELS.includes(level)) {
                state.details[level] = { percentage: row.grade || row.subject || '' };
            } else if (CGPA_LEVELS.includes(level)) {
                state.details[level] = { cgpaDivision: row.grade || row.subject || '' };
            }
        });
        Object.keys(byLevel).forEach(level => {
            state.details[level] = {
                subjects: byLevel[level].length > 0 ? byLevel[level] : [emptySubjectRow()]
            };
        });
        return state;
    }

    if (lead.qualification || lead.grades) {
        const level = normalizeLevelName(lead.qualification);
        if (level) {
            state.selected = [level];
            if (SUBJECT_GRADE_LEVELS.includes(level)) {
                state.details[level] = { subjects: [{ subject: '', grade: lead.grades || '' }] };
            } else if (PERCENTAGE_LEVELS.includes(level)) {
                state.details[level] = { percentage: lead.grades || '' };
            } else if (CGPA_LEVELS.includes(level)) {
                state.details[level] = { cgpaDivision: lead.grades || '' };
            }
        }
    }
    return state;
};

const buildQualificationsForApi = (qualifications) => {
    if (!qualifications?.selected?.length) return [];
    return qualifications.selected.map(level => {
        const detail = qualifications.details?.[level] || {};
        if (SUBJECT_GRADE_LEVELS.includes(level)) {
            return {
                level,
                subjects: (detail.subjects || []).map(s => ({
                    subject: (s.subject || '').trim(),
                    grade: (s.grade || '').trim()
                }))
            };
        }
        if (PERCENTAGE_LEVELS.includes(level)) {
            return { level, percentage: (detail.percentage || '').trim() };
        }
        if (CGPA_LEVELS.includes(level)) {
            return { level, cgpaDivision: (detail.cgpaDivision || '').trim() };
        }
        return { level };
    });
};

const parseAdmissionTestsFromLead = (lead) => {
    const defaults = {
        ielts: { attempted: '', score: '', date: '' },
        toefl: { attempted: '', score: '', date: '' },
        sat: { attempted: '', score: '', date: '' },
        gre_gmat: { attempted: '', score: '', date: '' }
    };
    if (!lead.admission_tests) return defaults;
    try {
        const parsed = typeof lead.admission_tests === 'string' ? JSON.parse(lead.admission_tests) : lead.admission_tests;
        return {
            ielts: { ...defaults.ielts, ...parsed.ielts },
            toefl: { ...defaults.toefl, ...parsed.toefl },
            sat: { ...defaults.sat, ...parsed.sat },
            gre_gmat: { ...defaults.gre_gmat, ...parsed.gre_gmat }
        };
    } catch (e) {
        return defaults;
    }
};

const parseCountriesOfInterest = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(c => String(c).trim()).filter(Boolean);
    }
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(parsed)) return parsed.map(c => String(c).trim()).filter(Boolean);
        return [String(value).trim()].filter(Boolean);
    } catch {
        return String(value).split(',').map(c => c.trim()).filter(Boolean);
    }
};

const mapLeadToFormData = (lead) => {
    const countriesOfInterest = parseCountriesOfInterest(lead.countries_of_interest);
    return {
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        interest: lead.interest || '',
        program: lead.program || '',
        instituteName: lead.institute_name || '',
        countriesOfInterest,
        countriesOther: lead.countries_other || '',
        qualifications: parseQualificationsFromLead(lead),
        referredBy: lead.referred_by || '',
        counsellorNotes: lead.counsellor_notes || lead.comments || '',
        admissionTests: parseAdmissionTestsFromLead(lead)
    };
};

export default function LeadForm() {
    const [currentScreen, setCurrentScreen] = useState('selection');
    const [isFollowUp, setIsFollowUp] = useState(false);
    const [isGeneralVisit, setIsGeneralVisit] = useState(false);
    const [currentLeadId, setCurrentLeadId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [followUpNumber, setFollowUpNumber] = useState(0);
    const [countries, setCountries] = useState([]);
    const [formData, setFormData] = useState(emptyFormData());
    const [visitorData, setVisitorData] = useState({
        visitorName: '',
        visitorType: '',
        contactNo: '',
        email: '',
        address: '',
        idType: '',
        idNumber: '',
        purpose: '',
        visitDate: new Date().toISOString().split('T')[0],
        timeIn: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timeOut: '',
        personToMeet: '',
        department: '',
        remarks: ''
    });
    const [lookupData, setLookupData] = useState({
        lookupName: '',
        lookupEmail: '',
        lookupPhone: '',
        purposeOfVisit: '',
        purposeOfVisitOther: ''
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        fetch(`${API_URL}/countries`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCountries(data.countries.filter(c => c.status === 'Active'));
                }
            })
            .catch(err => console.error('Failed to fetch countries:', err));
    }, []);

    const showSelection = () => {
        setCurrentScreen('selection');
        resetForm();
    };

    const showForm = (formType) => {
        setError('');
        if (formType === 'firstTime') {
            setIsFollowUp(false);
            setIsGeneralVisit(false);
            setCurrentScreen('registration');
        } else if (formType === 'followUp') {
            setIsFollowUp(true);
            setIsGeneralVisit(false);
            setCurrentScreen('lookup');
        } else if (formType === 'generalVisit') {
            setIsFollowUp(false);
            setIsGeneralVisit(true);
            setCurrentScreen('visitorForm');
        }
    };

    const showLookupScreen = () => {
        setCurrentScreen('lookup');
        setError('');
    };

    const showRegistrationForm = () => {
        setCurrentScreen('registration');
        setError('');
    };

    const handleBack = () => {
        setError('');
        setFieldErrors({});
        if (isFollowUp) {
            showLookupScreen();
        } else {
            showSelection();
        }
    };

    const resetForm = () => {
        setFormData(emptyFormData());
        setVisitorData({
            visitorName: '',
            visitorType: '',
            contactNo: '',
            email: '',
            address: '',
            idType: '',
            idNumber: '',
            purpose: '',
            visitDate: new Date().toISOString().split('T')[0],
            timeIn: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            timeOut: '',
            personToMeet: '',
            department: '',
            remarks: ''
        });
        setLookupData({
            lookupName: '',
            lookupEmail: '',
            lookupPhone: '',
            purposeOfVisit: '',
            purposeOfVisitOther: ''
        });
        setIsFollowUp(false);
        setIsGeneralVisit(false);
        setCurrentLeadId(null);
        setError('');
        setFieldErrors({});
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 3) {
            errors.fullName = 'Full name must be at least 3 characters';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (phoneDigits.length < 10) {
            errors.phone = 'Please enter a valid phone number (min 10 digits)';
        }

        if (!formData.address.trim()) {
            errors.address = 'Address is required';
        } else if (formData.address.trim().length < 10) {
            errors.address = 'Please provide a complete address (min 10 characters)';
        }

        if (!formData.interest.trim()) {
            errors.interest = 'Please enter your area of interest';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateVisitorForm = () => {
        const errors = {};
        
        if (!visitorData.visitorName.trim()) {
            errors.visitorName = 'Visitor name is required';
        } else if (visitorData.visitorName.trim().length < 3) {
            errors.visitorName = 'Visitor name must be at least 3 characters';
        }

        if (!visitorData.visitorType) {
            errors.visitorType = 'Please select visitor type';
        }

        const phoneDigits = visitorData.contactNo.replace(/\D/g, '');
        if (!visitorData.contactNo.trim()) {
            errors.contactNo = 'Contact number is required';
        } else if (phoneDigits.length < 10) {
            errors.contactNo = 'Please enter a valid contact number (min 10 digits)';
        }

        if (visitorData.email && visitorData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(visitorData.email)) {
                errors.email = 'Please enter a valid email address';
            }
        }

        if (!visitorData.purpose.trim()) {
            errors.purpose = 'Purpose of visit is required';
        } else if (visitorData.purpose.trim().length < 5) {
            errors.purpose = 'Please provide more details about the purpose (min 5 characters)';
        }

        if (!visitorData.visitDate) {
            errors.visitDate = 'Visit date is required';
        }

        if (!visitorData.timeIn) {
            errors.timeIn = 'Time in is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateLookupForm = () => {
        const errors = {};

        if (!lookupData.lookupName.trim()) {
            errors.lookupName = 'Full name is required';
        }

        const hasEmail = lookupData.lookupEmail.trim().length > 0;
        const hasPhone = lookupData.lookupPhone.trim().length > 0;

        if (!hasEmail && !hasPhone) {
            errors.lookupContact = 'Please provide either an email address or phone number';
        } else {
            if (hasEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(lookupData.lookupEmail.trim())) {
                    errors.lookupEmail = 'Please enter a valid email address';
                }
            }
            if (hasPhone) {
                const phoneDigits = lookupData.lookupPhone.replace(/\D/g, '');
                if (phoneDigits.length < 10) {
                    errors.lookupPhone = 'Please enter a valid phone number (min 10 digits)';
                }
            }
        }

        if (!lookupData.purposeOfVisit.trim()) {
            errors.purposeOfVisit = 'Purpose of visit is required';
        } else if (lookupData.purposeOfVisit === 'Other' && !lookupData.purposeOfVisitOther.trim()) {
            errors.purposeOfVisit = 'Please specify the purpose of visit';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resolvePurposeOfVisit = () => {
        if (lookupData.purposeOfVisit === 'Other') {
            return `Other: ${lookupData.purposeOfVisitOther.trim()}`;
        }
        return lookupData.purposeOfVisit;
    };

    const handleLookupSubmit = async (e) => {
        e.preventDefault();

        if (!validateLookupForm()) {
            setError('Please fix the errors below before continuing');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_URL}/leads/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lookupName: lookupData.lookupName,
                    lookupEmail: lookupData.lookupEmail,
                    lookupPhone: lookupData.lookupPhone,
                    purposeOfVisit: resolvePurposeOfVisit()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setCurrentLeadId(data.lead.id);
                setFollowUpNumber(data.lead.follow_up_count + 1);
                setFormData(mapLeadToFormData(data.lead));
                showRegistrationForm();
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error('Lookup error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setError('Please fix the errors below before submitting');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            let response;
            const payload = {
                ...formData,
                qualifications: buildQualificationsForApi(formData.qualifications)
            };
            
            if (isFollowUp && currentLeadId) {
                response = await fetch(`${API_URL}/leads/${currentLeadId}/follow-up`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, purposeOfVisit: resolvePurposeOfVisit() })
                });
            } else {
                response = await fetch(`${API_URL}/leads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                if (isFollowUp) {
                    setSuccessMessage(`Your Follow-Up #${data.followUpNumber} has been successfully submitted!`);
                } else {
                    setSuccessMessage(data.message);
                }
                setShowSuccessModal(true);
            } else {
                setError(data.message);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('Network error. Please check your connection and try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleVisitorSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateVisitorForm()) {
            setError('Please fix the errors below before submitting');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_URL}/visitor-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...visitorData, status: 'In Progress' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSuccessMessage(`Visitor log created successfully! Log ID: ${data.logId}`);
                setShowSuccessModal(true);
            } else {
                setError(data.message);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('Network error. Please check your connection and try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowSuccessModal(false);
        setSuccessMessage('');
        showSelection();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCountryToggle = (country) => {
        setFormData(prev => {
            const current = prev.countriesOfInterest || [];
            const updated = current.includes(country)
                ? current.filter(c => c !== country)
                : [...current, country];
            return { ...prev, countriesOfInterest: updated };
        });
    };

    const handleQualificationToggle = (level) => {
        setFormData(prev => {
            const selected = prev.qualifications.selected || [];
            const isSelected = selected.includes(level);
            const nextSelected = isSelected
                ? selected.filter(l => l !== level)
                : [...selected, level];

            const details = { ...prev.qualifications.details };
            if (!isSelected) {
                if (SUBJECT_GRADE_LEVELS.includes(level)) {
                    details[level] = { subjects: [emptySubjectRow()] };
                } else if (PERCENTAGE_LEVELS.includes(level)) {
                    details[level] = { percentage: '' };
                } else if (CGPA_LEVELS.includes(level)) {
                    details[level] = { cgpaDivision: '' };
                }
            }

            return {
                ...prev,
                qualifications: { selected: nextSelected, details }
            };
        });
    };

    const handleQualificationDetailChange = (level, field, value) => {
        setFormData(prev => ({
            ...prev,
            qualifications: {
                ...prev.qualifications,
                details: {
                    ...prev.qualifications.details,
                    [level]: {
                        ...prev.qualifications.details[level],
                        [field]: value
                    }
                }
            }
        }));
    };

    const handleSubjectRowChange = (level, index, field, value) => {
        setFormData(prev => {
            const subjects = [...(prev.qualifications.details[level]?.subjects || [])];
            subjects[index] = { ...subjects[index], [field]: value };
            return {
                ...prev,
                qualifications: {
                    ...prev.qualifications,
                    details: {
                        ...prev.qualifications.details,
                        [level]: { subjects }
                    }
                }
            };
        });
    };

    const addSubjectRow = (level) => {
        setFormData(prev => ({
            ...prev,
            qualifications: {
                ...prev.qualifications,
                details: {
                    ...prev.qualifications.details,
                    [level]: {
                        subjects: [...(prev.qualifications.details[level]?.subjects || []), emptySubjectRow()]
                    }
                }
            }
        }));
    };

    const removeSubjectRow = (level, index) => {
        setFormData(prev => {
            const subjects = prev.qualifications.details[level]?.subjects || [];
            const next = subjects.length > 1
                ? subjects.filter((_, i) => i !== index)
                : [emptySubjectRow()];
            return {
                ...prev,
                qualifications: {
                    ...prev.qualifications,
                    details: {
                        ...prev.qualifications.details,
                        [level]: { subjects: next }
                    }
                }
            };
        });
    };

    const handleAdmissionTestChange = (testKey, field, value) => {
        setFormData(prev => ({
            ...prev,
            admissionTests: {
                ...prev.admissionTests,
                [testKey]: { ...prev.admissionTests[testKey], [field]: value }
            }
        }));
    };

    const handleVisitorChange = (e) => {
        const { name, value } = e.target;
        setVisitorData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleLookupChange = (e) => {
        const { name, value } = e.target;
        setLookupData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'purposeOfVisit' && value !== 'Other' ? { purposeOfVisitOther: '' } : {})
        }));
        if (fieldErrors[name] || fieldErrors.purposeOfVisit || fieldErrors.lookupContact) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: '',
                purposeOfVisit: name === 'purposeOfVisit' || name === 'purposeOfVisitOther' ? '' : prev.purposeOfVisit,
                lookupContact: ''
            }));
        }
    };

    return (
        <div className="lead-form-container">
            <div className="container">
                {/* Logo/Header Section */}
                <div className="header">
                    <div className="logo-section">
                        <img src="/images/logo.webp" alt="Logo" />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Selection Screen */}
                {currentScreen === 'selection' && (
                    <div className="selection-screen active">
                        <div className="selection-container">
                            <h2 className="section-title">Welcome</h2>
                            <p className="section-subtitle">Please select an option to continue</p>
                            
                            <div className="selection-cards">
                                <div className="selection-card" onClick={() => showForm('firstTime')}>
                                    <div className="card-icon">
                                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="30" cy="30" r="28" fill="#f6730d" opacity="0.1"/>
                                            <path d="M30 15 L30 45 M15 30 L45 30" stroke="#f6730d" strokeWidth="3" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <h3>First Time Query</h3>
                                    <p>New student registration and inquiry</p>
                                    <div className="card-arrow">→</div>
                                </div>

                                <div className="selection-card" onClick={() => showForm('followUp')}>
                                    <div className="card-icon">
                                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="30" cy="30" r="28" fill="#1a6dc2" opacity="0.1"/>
                                            <path d="M20 30 L28 38 L42 22" stroke="#1a6dc2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3>Follow Up</h3>
                                    <p>Continue existing application</p>
                                    <div className="card-arrow">→</div>
                                </div>

                                <div className="selection-card" onClick={() => showForm('generalVisit')}>
                                    <div className="card-icon">
                                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="30" cy="30" r="28" fill="#10b981" opacity="0.1"/>
                                            <path d="M30 20 L30 32 M30 20 C23 20 18 25 18 32 C18 39 23 44 30 44 C37 44 42 39 42 32 C42 25 37 20 30 20 Z M27 36 L30 32 L33 36" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3>General Visit</h3>
                                    <p>For Vendors, Maintenance Workers, etc.</p>
                                    <div className="card-arrow">→</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Follow Up Lookup Screen */}
                {currentScreen === 'lookup' && (
                    <div className="form-screen">
                        <div className="form-container">
                            <button className="back-button" onClick={showSelection} type="button">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M12 4 L6 10 L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Back
                            </button>

                            {isFollowUp && followUpNumber > 0 && currentLeadId && (
                                <div style={{
                                    background: '#e0f2fe',
                                    color: '#075985',
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    border: '1px solid #444646ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                    </svg>
                                    <span style={{fontWeight: '500'}}>This is your Follow-Up #{followUpNumber}</span>
                                </div>
                            )}

                            <h2 className="section-title">Student Lookup</h2>
                            <p className="section-subtitle">Enter your details to retrieve your information</p>

                            <form onSubmit={handleLookupSubmit} className="registration-form">
                                <div className="form-grid">

                                    {/* Full Name */}
                                    <div className="form-group full-width">
                                        <label htmlFor="lookupName">Full Name *</label>
                                        <input 
                                            type="text" id="lookupName" name="lookupName"
                                            placeholder="Enter your full name"
                                            value={lookupData.lookupName}
                                            onChange={handleLookupChange}
                                            required disabled={loading}
                                            style={fieldErrors.lookupName ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.lookupName && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.lookupName}</span>}
                                    </div>

                                    {/* Contact separator note */}
                                    <div className="form-group full-width">
                                        <p style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '0.875rem',
                                            color: '#6b7280',
                                            fontStyle: 'italic'
                                        }}>
                                            Provide your email address, phone number, or both to look up your record.
                                        </p>
                                        {fieldErrors.lookupContact && (
                                            <span style={{color: '#ef4444', fontSize: '0.875rem'}}>{fieldErrors.lookupContact}</span>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="form-group">
                                        <label htmlFor="lookupEmail">Email Address</label>
                                        <input 
                                            type="email" id="lookupEmail" name="lookupEmail"
                                            placeholder="your.email@example.com"
                                            value={lookupData.lookupEmail}
                                            onChange={handleLookupChange}
                                            disabled={loading}
                                            style={fieldErrors.lookupEmail ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.lookupEmail && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.lookupEmail}</span>}
                                    </div>

                                    {/* Phone */}
                                    <div className="form-group">
                                        <label htmlFor="lookupPhone">Phone Number</label>
                                        <input 
                                            type="tel" id="lookupPhone" name="lookupPhone"
                                            placeholder="+92 300 1234567"
                                            value={lookupData.lookupPhone}
                                            onChange={handleLookupChange}
                                            disabled={loading}
                                            style={fieldErrors.lookupPhone ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.lookupPhone && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.lookupPhone}</span>}
                                    </div>

                                    {/* Purpose of Visit */}
                                    <div className="form-group full-width">
                                        <label>Purpose for your visit *</label>
                                        <div
                                            className="purpose-radio-list"
                                            style={fieldErrors.purposeOfVisit ? { borderColor: '#ef4444' } : undefined}
                                        >
                                            {PURPOSE_OF_VISIT_OPTIONS.map(option => (
                                                <label
                                                    key={option}
                                                    className={`purpose-radio-item${lookupData.purposeOfVisit === option ? ' selected' : ''}${option === 'Other' ? ' purpose-other' : ''}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="purposeOfVisit"
                                                        value={option}
                                                        checked={lookupData.purposeOfVisit === option}
                                                        onChange={handleLookupChange}
                                                        disabled={loading}
                                                    />
                                                    <span>{option === 'Other' ? 'Other:' : option}</span>
                                                    {option === 'Other' && (
                                                        <input
                                                            type="text"
                                                            name="purposeOfVisitOther"
                                                            className="purpose-other-input"
                                                            placeholder="Please specify"
                                                            value={lookupData.purposeOfVisitOther}
                                                            onChange={handleLookupChange}
                                                            disabled={loading || lookupData.purposeOfVisit !== 'Other'}
                                                            onClick={() => {
                                                                if (lookupData.purposeOfVisit !== 'Other') {
                                                                    setLookupData(prev => ({ ...prev, purposeOfVisit: 'Other' }));
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                        {fieldErrors.purposeOfVisit && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.purposeOfVisit}</span>}
                                    </div>

                                </div>

                                <button type="submit" className="submit-button" disabled={loading}>
                                    <span>{loading ? 'Searching...' : 'Continue'}</span>
                                    {!loading && (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M8 4 L14 10 L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Main Registration Form */}
                {currentScreen === 'registration' && (
                    <div className="form-screen">
                        <div className="form-container">
                            <button className="back-button" onClick={handleBack} type="button">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M12 4 L6 10 L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Back
                            </button>

                            <h2 className="section-title">
                                {isFollowUp ? 'Follow-Up Registration' : 'New Student Registration'}
                            </h2>
                            <p className="section-subtitle">
                                {isFollowUp ? 'Please review your information below and submit your follow-up' : 'Please provide your details for first-time inquiry'}
                            </p>

                            <form onSubmit={handleRegistrationSubmit} className={`registration-form${isFollowUp ? ' follow-up-readonly' : ''}`}>
                                <div className="form-grid">

                                    {/* Full Name */}
                                    <div className="form-group full-width">
                                        <label htmlFor="fullName">Full Name *</label>
                                        <input 
                                            type="text" id="fullName" name="fullName"
                                            placeholder="Enter your full name"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            required disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                            style={fieldErrors.fullName ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.fullName && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.fullName}</span>}
                                    </div>

                                    {/* Email */}
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address *</label>
                                        <input 
                                            type="email" id="email" name="email"
                                            placeholder="your.email@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                            style={fieldErrors.email ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.email && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.email}</span>}
                                    </div>

                                    {/* Phone */}
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number *</label>
                                        <input 
                                            type="tel" id="phone" name="phone"
                                            placeholder="+92 300 1234567"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                            style={fieldErrors.phone ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.phone && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.phone}</span>}
                                    </div>

                                    {/* Address */}
                                    <div className="form-group full-width">
                                        <label htmlFor="address">Complete Address *</label>
                                        <textarea 
                                            id="address" name="address" rows="3"
                                            placeholder="Enter your complete address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                            style={fieldErrors.address ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.address && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.address}</span>}
                                    </div>

                                    {/* Area of Interest — now a free text field */}
                                    <div className="form-group full-width">
                                        <label htmlFor="interest">Area of Interest *</label>
                                        <input 
                                            type="text" id="interest" name="interest"
                                            placeholder="e.g. Business, Engineering, Medicine..."
                                            value={formData.interest}
                                            onChange={handleInputChange}
                                            required disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                            style={fieldErrors.interest ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.interest && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.interest}</span>}
                                    </div>

                                    {/* Program */}
                                    <div className="form-group full-width">
                                        <label htmlFor="program">Program</label>
                                        <select 
                                            id="program" name="program"
                                            value={formData.program}
                                            onChange={handleInputChange}
                                            disabled={loading || isFollowUp}
                                        >
                                            <option value="">Select a program</option>
                                            <option value="undergraduate">Undergraduate Programs</option>
                                            <option value="graduate">Graduate Programs</option>
                                            <option value="phd">PhD Programs</option>
                                            <option value="scholarship">Scholarship Information</option>
                                            <option value="abroad">Study Abroad</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {/* School / College / Institute */}
                                    <div className="form-group full-width">
                                        <label htmlFor="instituteName">School/College/Institute Name</label>
                                        <input
                                            type="text"
                                            id="instituteName"
                                            name="instituteName"
                                            placeholder="Enter school, college, or institute name"
                                            value={formData.instituteName}
                                            onChange={handleInputChange}
                                            disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                        />
                                    </div>

                                    {/* Countries of Interest — loaded from /countries (Active only) */}
                                    <div className="form-group full-width">
                                        <label className="section-label-orange">
                                            Countries of Interest
                                        </label>
                                        <CountryMultiSelect
                                            countries={countries}
                                            selected={formData.countriesOfInterest}
                                            onToggle={handleCountryToggle}
                                            otherValue={formData.countriesOther}
                                            onOtherChange={(value) => setFormData(prev => ({ ...prev, countriesOther: value }))}
                                            disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                        />
                                    </div>

                                    {/* Qualification Section */}
                                    <div className="form-group full-width">
                                        <label className="section-label-orange">Qualification</label>
                                        <p className="qualification-prompt">{isFollowUp ? 'Your qualifications on file:' : 'Which qualification have you done?'}</p>
                                        <div className="countries-checkbox-grid qualification-levels-grid">
                                            {QUALIFICATION_OPTIONS.map(level => {
                                                const isSelected = (formData.qualifications.selected || []).includes(level);
                                                return (
                                                    <label
                                                        key={level}
                                                        className={`country-checkbox-item${isSelected ? ' selected' : ''}${isFollowUp ? ' read-only' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleQualificationToggle(level)}
                                                            disabled={loading || isFollowUp}
                                                        />
                                                        <span>{level}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        {(formData.qualifications.selected || []).map(level => (
                                            <div key={level} className="qualification-detail-box">
                                                <h4 className="qualification-detail-title">{level}</h4>

                                                {SUBJECT_GRADE_LEVELS.includes(level) && (
                                                    <div className="qualification-table">
                                                        <div className="qualification-header qualification-header-subjects">
                                                            <span>Subject</span>
                                                            <span>Grade</span>
                                                            <span></span>
                                                        </div>
                                                        {(formData.qualifications.details[level]?.subjects || []).map((row, index) => (
                                                            <div key={index} className="qualification-row qualification-row-subjects">
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Mathematics"
                                                                    value={row.subject}
                                                                    onChange={(e) => handleSubjectRowChange(level, index, 'subject', e.target.value)}
                                                                    disabled={loading || isFollowUp}
                                                                    readOnly={isFollowUp}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. A*"
                                                                    value={row.grade}
                                                                    onChange={(e) => handleSubjectRowChange(level, index, 'grade', e.target.value)}
                                                                    disabled={loading || isFollowUp}
                                                                    readOnly={isFollowUp}
                                                                />
                                                                {!isFollowUp && (
                                                                <button
                                                                    type="button"
                                                                    className="qualification-remove-btn"
                                                                    onClick={() => removeSubjectRow(level, index)}
                                                                    disabled={loading}
                                                                    title="Remove row"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    </svg>
                                                                </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {!isFollowUp && (
                                                        <button type="button" className="add-subject-btn" onClick={() => addSubjectRow(level)} disabled={loading}>
                                                            + Add Subject
                                                        </button>
                                                        )}
                                                    </div>
                                                )}

                                                {PERCENTAGE_LEVELS.includes(level) && (
                                                    <div className="qualification-simple-field">
                                                        <label>Percentage</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. 85%"
                                                            value={formData.qualifications.details[level]?.percentage || ''}
                                                            onChange={(e) => handleQualificationDetailChange(level, 'percentage', e.target.value)}
                                                            disabled={loading || isFollowUp}
                                                            readOnly={isFollowUp}
                                                        />
                                                    </div>
                                                )}

                                                {CGPA_LEVELS.includes(level) && (
                                                    <div className="qualification-simple-field">
                                                        <label>CGPA / Division</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. 3.5 / First Division"
                                                            value={formData.qualifications.details[level]?.cgpaDivision || ''}
                                                            onChange={(e) => handleQualificationDetailChange(level, 'cgpaDivision', e.target.value)}
                                                            disabled={loading || isFollowUp}
                                                            readOnly={isFollowUp}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Referred By */}
                                    <div className="form-group full-width">
                                        <label htmlFor="referredBy">Referred By</label>
                                        <select
                                            id="referredBy"
                                            name="referredBy"
                                            value={formData.referredBy}
                                            onChange={handleInputChange}
                                            disabled={loading || isFollowUp}
                                        >
                                            <option value="">How did you hear about us?</option>
                                            {REFERRED_BY_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* English / Admission Tests */}
                                    <div className="form-group full-width">
                                        <label className="section-label-orange">English / Admission Tests</label>
                                        <div className="admission-tests-table">
                                            <div className="admission-tests-header">
                                                <span>Test</span>
                                                <span>Attempted?</span>
                                                <span>Score</span>
                                                <span>Date (If Available)</span>
                                            </div>
                                            {Object.entries(ADMISSION_TEST_LABELS).map(([key, label]) => (
                                                <div key={key} className="admission-test-row">
                                                    <span className="test-name">{label}</span>
                                                    <select
                                                        value={formData.admissionTests[key].attempted}
                                                        onChange={(e) => handleAdmissionTestChange(key, 'attempted', e.target.value)}
                                                        disabled={loading || isFollowUp}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                        <option value="Not Attempted">Not Attempted</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder={key === 'ielts' ? 'e.g. 6.5' : key === 'toefl' ? 'e.g. 90' : key === 'sat' ? 'e.g. 1200' : 'e.g. 310'}
                                                        value={formData.admissionTests[key].score}
                                                        onChange={(e) => handleAdmissionTestChange(key, 'score', e.target.value)}
                                                        disabled={loading || isFollowUp || formData.admissionTests[key].attempted !== 'Yes'}
                                                        readOnly={isFollowUp}
                                                    />
                                                    <input
                                                        type="date"
                                                        value={formData.admissionTests[key].date}
                                                        onChange={(e) => handleAdmissionTestChange(key, 'date', e.target.value)}
                                                        disabled={loading || isFollowUp || formData.admissionTests[key].attempted !== 'Yes'}
                                                        readOnly={isFollowUp}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Counsellor Notes */}
                                    <div className="form-group full-width">
                                        <label htmlFor="counsellorNotes">Counsellor Notes</label>
                                        <textarea
                                            id="counsellorNotes"
                                            name="counsellorNotes"
                                            rows="4"
                                            placeholder="Write your notes here..."
                                            value={formData.counsellorNotes}
                                            onChange={handleInputChange}
                                            disabled={loading || isFollowUp}
                                            readOnly={isFollowUp}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="submit-button" disabled={loading}>
                                    <span>{loading ? 'Submitting...' : (isFollowUp ? 'Submit Follow-Up' : 'Submit Registration')}</span>
                                    {!loading && (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M4 10 L16 10 M12 6 L16 10 L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* General Visit Form */}
                {currentScreen === 'visitorForm' && (
                    <div className="form-screen">
                        <div className="form-container">
                            <button className="back-button" onClick={showSelection} type="button">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M12 4 L6 10 L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Back
                            </button>

                            <h2 className="section-title">General Visit Form</h2>
                            <p className="section-subtitle">Please provide visitor details</p>

                            <form onSubmit={handleVisitorSubmit} className="registration-form">
                                <div className="form-grid">

                                    <div className="form-group full-width">
                                        <label htmlFor="visitorName">Visitor Name *</label>
                                        <input 
                                            type="text" id="visitorName" name="visitorName"
                                            placeholder="Enter visitor's full name"
                                            value={visitorData.visitorName}
                                            onChange={handleVisitorChange}
                                            required disabled={loading}
                                            style={fieldErrors.visitorName ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.visitorName && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.visitorName}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="visitorType">Visitor Type *</label>
                                        <select 
                                            id="visitorType" name="visitorType"
                                            value={visitorData.visitorType}
                                            onChange={handleVisitorChange}
                                            required disabled={loading}
                                            style={fieldErrors.visitorType ? {borderColor: '#ef4444'} : {}}
                                        >
                                            <option value="">Select visitor type</option>
                                            <option value="Student">Student</option>
                                            <option value="Parent">Parent/Guardian</option>
                                            <option value="Counselor">Counselor</option>
                                            <option value="Maintenance">Maintenance (Electrician, AC Repair, etc.)</option>
                                            <option value="Vendor">Vendor/Supplier</option>
                                            <option value="Official">Official/Government</option>
                                            <option value="Guest">Guest</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {fieldErrors.visitorType && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.visitorType}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="contactNo">Contact Number *</label>
                                        <input 
                                            type="tel" id="contactNo" name="contactNo"
                                            placeholder="+92 300 1234567"
                                            value={visitorData.contactNo}
                                            onChange={handleVisitorChange}
                                            required disabled={loading}
                                            style={fieldErrors.contactNo ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.contactNo && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.contactNo}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" id="email" name="email"
                                            placeholder="visitor@example.com"
                                            value={visitorData.email}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                            style={fieldErrors.email ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.email && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.email}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="address">Address</label>
                                        <input 
                                            type="text" id="address" name="address"
                                            placeholder="Enter address"
                                            value={visitorData.address}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="idType">ID Type</label>
                                        <select 
                                            id="idType" name="idType"
                                            value={visitorData.idType}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        >
                                            <option value="">Select ID type</option>
                                            <option value="CNIC">CNIC</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Driving License">Driving License</option>
                                            <option value="Student ID">Student ID Card</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="idNumber">ID Number</label>
                                        <input 
                                            type="text" id="idNumber" name="idNumber"
                                            placeholder="Enter ID number"
                                            value={visitorData.idNumber}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="purpose">Purpose of Visit *</label>
                                        <textarea 
                                            id="purpose" name="purpose" rows="3"
                                            placeholder="Enter purpose of visit"
                                            value={visitorData.purpose}
                                            onChange={handleVisitorChange}
                                            required disabled={loading}
                                            style={fieldErrors.purpose ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.purpose && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.purpose}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="visitDate">Visit Date *</label>
                                        <input 
                                            type="date" id="visitDate" name="visitDate"
                                            value={visitorData.visitDate}
                                            onChange={handleVisitorChange}
                                            required disabled={loading}
                                            style={fieldErrors.visitDate ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.visitDate && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.visitDate}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="timeIn">Time In *</label>
                                        <input 
                                            type="time" id="timeIn" name="timeIn"
                                            value={visitorData.timeIn}
                                            onChange={handleVisitorChange}
                                            required disabled={loading}
                                            style={fieldErrors.timeIn ? {borderColor: '#ef4444'} : {}}
                                        />
                                        {fieldErrors.timeIn && <span style={{color: '#ef4444', fontSize: '0.875rem', marginTop: '4px'}}>{fieldErrors.timeIn}</span>}
                                    </div>

                                    <div className="form-group d-none">
                                        <label htmlFor="timeOut">Time Out</label>
                                        <input 
                                            type="time" id="timeOut" name="timeOut"
                                            value={visitorData.timeOut}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="personToMeet">Person to Meet</label>
                                        <input 
                                            type="text" id="personToMeet" name="personToMeet"
                                            placeholder="Enter person's name"
                                            value={visitorData.personToMeet}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="department">Department</label>
                                        <input 
                                            type="text" id="department" name="department"
                                            placeholder="Enter department"
                                            value={visitorData.department}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="remarks">Additional Remarks</label>
                                        <textarea 
                                            id="remarks" name="remarks" rows="3"
                                            placeholder="Any additional information..."
                                            value={visitorData.remarks}
                                            onChange={handleVisitorChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="submit-button" disabled={loading}>
                                    <span>{loading ? 'Submitting...' : 'Submit Visitor Log'}</span>
                                    {!loading && (
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M4 10 L16 10 M12 6 L16 10 L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="modal active" onClick={(e) => {
                        if (e.target.className.includes('modal')) closeModal();
                    }}>
                        <div className="modal-content">
                            <div className="success-icon">
                                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                    <circle cx="40" cy="40" r="38" fill="#f6730d" opacity="0.1"/>
                                    <circle cx="40" cy="40" r="30" stroke="#f6730d" strokeWidth="3"/>
                                    <path d="M28 40 L36 48 L52 32" stroke="#f6730d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3>Success!</h3>
                            <p>{successMessage}</p>
                            <button className="modal-button" onClick={closeModal}>Done</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}