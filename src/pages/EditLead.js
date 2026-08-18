import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/leads.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import MeetingScheduler from '../components/MeetingScheduler'
import CountryMultiSelect from '../components/CountryMultiSelect'
import { ViewModeWrap } from '../components/ViewRecordModal'
import { REFERRED_BY_OPTIONS } from '../constants/referredByOptions'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserPlus,
    faArrowLeft,
    faSave,
    faUserCheck,
    faHistory,
    faUserTie,
    faTimes,
    faCalendarAlt,
    faCheckCircle,
    faClock,
    faExclamationTriangle,
    faTrash,
    faPlus,
    faSearch,
    faGlobe,
    faCreditCard,
    faFlag,
    faFileInvoiceDollar,
    faLink,
    faMoneyBillWave,
    faExternalLinkAlt,
    faUserGraduate,
    faReceipt,
} from "@fortawesome/free-solid-svg-icons";

const LEAD_STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'converted', label: 'Converted' },
    { value: 'closed', label: 'Closed' },
];

const normalizeLeadStatus = (value) => {
    if (!value) return 'new';
    const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
    return LEAD_STATUS_OPTIONS.some(opt => opt.value === key) ? key : 'new';
};

const leadStatusLabel = (value) => {
    const match = LEAD_STATUS_OPTIONS.find(opt => opt.value === normalizeLeadStatus(value));
    return match ? match.label : 'New';
};

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const QUALIFICATION_OPTIONS = [
    'O Level', 'A Level', 'Matriculation', 'Intermediate', 'Graduate', 'Post Graduate'
];

const SUBJECT_GRADE_LEVELS = ['O Level', 'A Level'];
const PERCENTAGE_LEVELS = ['Matriculation', 'Intermediate'];
const CGPA_LEVELS = ['Graduate', 'Post Graduate'];

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
    const defaults = JSON.parse(JSON.stringify(DEFAULT_ADMISSION_TESTS));
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

const mapInvoiceStatusToLead = (status) => {
    if (status === 'Paid') return 'Paid';
    if (status === 'Partially Paid') return 'Partially Paid';
    return 'Unpaid';
};

const canRegisterFromPayment = (status) => ['Paid', 'Partially Paid'].includes(status);

const getPaymentStatusStyle = (status) => {
    const map = {
        'Paid':           { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
        'Pending':        { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
        'Partially Paid': { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
    };
    return map[status] || { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
};

const parseCountries = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const resolveLeadCountries = (countries, countriesOther) => {
    const list = Array.isArray(countries) ? countries : parseCountries(countries);
    const other = (countriesOther || '').trim();
    return list
        .map(c => {
            const name = String(c).trim();
            if (name.toLowerCase() === 'other') return other || null;
            return name;
        })
        .filter(Boolean);
};

const formatLeadCountries = (countries, countriesOther) =>
    resolveLeadCountries(countries, countriesOther).join(', ') || '—';

const buildApplicantInfoFromLead = (lead) => {
    const nameParts = (lead.full_name || '').trim().split(/\s+/).filter(Boolean);
    const countryNames = resolveLeadCountries(lead.countries_of_interest, lead.countries_other);
    return {
        name: nameParts[0] || '',
        middle_name: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
        surname: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
        email: lead.email || '',
        mobile: lead.phone || '',
        address: lead.address || '',
        country: countryNames.length ? countryNames.join(', ') : '',
        course: lead.course || lead.program || '',
        source_inquiry: lead.referred_by || '',
        status: 'Active',
    };
};

export default function EditLead({ recordId, viewOnly = false } = {}) {
    const { id: paramId } = useParams();
    const id = recordId || paramId;
    const navigate = useNavigate();

    const [leadData, setLeadData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        interest: '',
        program: '',
        institute_name: '',
        comments: '',
        status: 'new',
        is_registered: false,
        countries_of_interest: [],
        countries_other: '',
        course: '',
        qualifications: emptyQualificationsState(),
        referred_by: '',
        admission_tests: JSON.parse(JSON.stringify(DEFAULT_ADMISSION_TESTS))
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [followUpHistory, setFollowUpHistory] = useState([]);
    const [leadChanges, setLeadChanges] = useState([]);

    const [allCounselors, setAllCounselors] = useState([]);
    const [assignedCounselors, setAssignedCounselors] = useState([]);
    const [showCounselorModal, setShowCounselorModal] = useState(false);
    const [counselorSearchTerm, setCounselorSearchTerm] = useState('');
    const [assigningCounselor, setAssigningCounselor] = useState(false);

    const [meetings, setMeetings] = useState([]);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedCounselorForMeeting, setSelectedCounselorForMeeting] = useState(null);

    const [countries, setCountries] = useState([]);

    const [paymentStatus, setPaymentStatus] = useState('Unpaid');
    const [regFormError, setRegFormError] = useState('');

    // ── Lead payment / invoice linking ─────────────────────────────────────────
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [leadInvoices, setLeadInvoices] = useState([]);
    const [leadInvoicesLoading, setLeadInvoicesLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ paymentStatus: 'Pending', installmentAmount: '', paymentDate: '' });
    const [invoicePayments, setInvoicePayments] = useState([]);
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [paymentModalError, setPaymentModalError] = useState('');
    const [linkingInvoice, setLinkingInvoice] = useState(false);

    useEffect(() => {
        if (id) {
            fetchLeadData();
            fetchLeadHistory();
            fetchAssignedCounselors();
            fetchMeetings();
        }
    }, [id]);

    useEffect(() => {
        if (showCounselorModal) fetchAllCounselors();
    }, [showCounselorModal]);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchLeadData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/leads/${id}`);
            const data = await response.json();
            if (data.success) {
                setLeadData({
                    ...data.lead,
                    countries_of_interest: parseCountries(data.lead.countries_of_interest),
                    countries_other: data.lead.countries_other || '',
                    course: data.lead.course || '',
                    status: normalizeLeadStatus(data.lead.status),
                    program: data.lead.program || '',
                    institute_name: data.lead.institute_name || '',
                    interest: data.lead.interest || '',
                    comments: data.lead.counsellor_notes || data.lead.comments || '',
                    referred_by: data.lead.referred_by || '',
                    qualifications: parseQualificationsFromLead(data.lead),
                    admission_tests: parseAdmissionTestsFromLead(data.lead)
                });
                setPaymentStatus(data.lead.payment_status || 'Unpaid');
                if (data.lead.invoice_id) {
                    fetch(`${API_URL}/finance/invoices/${data.lead.invoice_id}`)
                        .then(r => r.json())
                        .then(invData => {
                            if (invData.success && invData.invoice) {
                                setSelectedInvoice(invData.invoice);
                            }
                        })
                        .catch(() => {});
                }
            } else {
                setError(data.message || 'Failed to fetch lead data');
            }
        } catch (err) {
            console.error('Error fetching lead:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeadInvoices = async () => {
        setLeadInvoicesLoading(true);
        setPaymentModalError('');
        try {
            const res = await fetch(`${API_URL}/leads/${id}/invoices`);
            const data = await res.json();
            if (data.success) {
                setLeadInvoices(data.invoices || []);
                setPaymentStatus(data.paymentStatus || 'Unpaid');
                if (data.linkedInvoice) {
                    setSelectedInvoice(data.linkedInvoice);
                    setPaymentForm({
                        paymentStatus: data.linkedInvoice.payment_status || 'Pending',
                        installmentAmount: '',
                        paymentDate: new Date().toISOString().slice(0, 10)
                    });
                    try {
                        const payRes = await fetch(`${API_URL}/finance/invoices/${data.linkedInvoice.id}/payments`);
                        const payData = await payRes.json();
                        setInvoicePayments(payData.success ? (payData.payments || []) : []);
                    } catch {
                        setInvoicePayments([]);
                    }
                } else {
                    setSelectedInvoice(null);
                    setInvoicePayments([]);
                    setPaymentForm({ paymentStatus: 'Pending', installmentAmount: '', paymentDate: new Date().toISOString().slice(0, 10) });
                }
            } else {
                setPaymentModalError(data.message || 'Failed to load invoices');
            }
        } catch (err) {
            setPaymentModalError('Network error. Please try again.');
        } finally {
            setLeadInvoicesLoading(false);
        }
    };

    const openPaymentModal = () => {
        setShowPaymentModal(true);
        fetchLeadInvoices();
    };

    const handleLinkInvoice = async (invoice) => {
        if (!invoice.countries_match) return;
        setLinkingInvoice(true);
        setPaymentModalError('');
        try {
            const res = await fetch(`${API_URL}/leads/${id}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId: invoice.id })
            });
            const data = await res.json();
            if (data.success) {
                setSelectedInvoice(invoice);
                setPaymentStatus(data.paymentStatus);
                setPaymentForm({
                    paymentStatus: invoice.payment_status || 'Pending',
                    installmentAmount: '',
                    paymentDate: new Date().toISOString().slice(0, 10)
                });
                await fetchLeadInvoices();
                setLeadData(prev => ({ ...prev, payment_status: data.paymentStatus, invoice_id: invoice.id }));
            } else {
                setPaymentModalError(data.message || 'Failed to link invoice');
            }
        } catch (err) {
            setPaymentModalError('Network error. Please try again.');
        } finally {
            setLinkingInvoice(false);
        }
    };

    const handleUpdateInvoicePayment = async () => {
        if (!selectedInvoice) return;
        const amount = parseFloat(paymentForm.installmentAmount);
        const hasInstallment = isFinite(amount) && amount > 0;
        setUpdatingPayment(true);
        setPaymentModalError('');
        try {
            let data;
            if (hasInstallment) {
                const res = await fetch(`${API_URL}/finance/invoices/${selectedInvoice.id}/payments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        paymentDate: paymentForm.paymentDate,
                        paymentStatus: paymentForm.paymentStatus
                    })
                });
                data = await res.json();
            } else {
                const res = await fetch(`${API_URL}/finance/invoices/${selectedInvoice.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentStatus: paymentForm.paymentStatus })
                });
                data = await res.json();
            }
            if (data.success) {
                const status = data.paymentStatus || paymentForm.paymentStatus;
                const leadStatus = mapInvoiceStatusToLead(status);
                setPaymentStatus(leadStatus);
                setLeadData(prev => ({ ...prev, payment_status: leadStatus }));
                if (data.payments) setInvoicePayments(data.payments);
                await fetchLeadInvoices();
            } else {
                setPaymentModalError(data.message || 'Failed to update payment');
            }
        } catch (err) {
            setPaymentModalError('Network error. Please try again.');
        } finally {
            setUpdatingPayment(false);
        }
    };

    const fetchLeadHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/leads/${id}/history`);
            const data = await response.json();
            if (data.success) {
                setFollowUpHistory(data.followUps || []);
                setLeadChanges(data.changes || []);
            }
        } catch (err) {
            console.error('Error fetching lead history:', err);
        }
    };

    const fetchAllCounselors = async () => {
        try {
            const response = await fetch(`${API_URL}/counselors`);
            const data = await response.json();
            if (data.success) setAllCounselors(data.counselors);
        } catch (err) {
            console.error('Error fetching counselors:', err);
        }
    };

    const fetchAssignedCounselors = async () => {
        try {
            const response = await fetch(`${API_URL}/leads/${id}/counselors`);
            const data = await response.json();
            if (data.success) setAssignedCounselors(data.counselors || []);
        } catch (err) {
            console.error('Error fetching assigned counselors:', err);
        }
    };

    const fetchMeetings = async () => {
        try {
            const response = await fetch(`${API_URL}/leads/${id}/meetings`);
            const data = await response.json();
            if (data.success) setMeetings(data.meetings || []);
        } catch (err) {
            console.error('Error fetching meetings:', err);
        }
    };

    const fetchCountries = async () => {
        try {
            const response = await fetch(`${API_URL}/countries`);
            const data = await response.json();
            if (data.success) {
                setCountries(data.countries.filter(c => c.status === 'Active'));
            }
        } catch (err) {
            console.error('Error fetching countries:', err);
        }
    };

    const formatLeadId = (leadId) => `LEAD${String(leadId).padStart(5, '0')}`;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLeadData(prev => ({ ...prev, [name]: value }));
    };

    const handleCountryToggle = (country) => {
        setLeadData(prev => {
            const current = prev.countries_of_interest || [];
            const updated = current.includes(country)
                ? current.filter(c => c !== country)
                : [...current, country];
            return {
                ...prev,
                countries_of_interest: updated,
                countries_other: updated.includes('Other') ? prev.countries_other : ''
            };
        });
    };

    const handleQualificationToggle = (level) => {
        setLeadData(prev => {
            const selected = prev.qualifications?.selected || [];
            const isSelected = selected.includes(level);
            const nextSelected = isSelected
                ? selected.filter(l => l !== level)
                : [...selected, level];

            const details = { ...(prev.qualifications?.details || emptyQualificationDetails()) };
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
        setLeadData(prev => ({
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
        setLeadData(prev => {
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
        setLeadData(prev => ({
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
        setLeadData(prev => {
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
        setLeadData(prev => ({
            ...prev,
            admission_tests: {
                ...prev.admission_tests,
                [testKey]: { ...prev.admission_tests[testKey], [field]: value }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (viewOnly) return;
        setSaving(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: leadData.full_name,
                    email: leadData.email,
                    phone: leadData.phone,
                    address: leadData.address,
                    interest: leadData.interest,
                    program: leadData.program,
                    instituteName: leadData.institute_name,
                    counsellorNotes: leadData.comments,
                    comments: leadData.comments,
                    status: leadData.status,
                    countriesOfInterest: leadData.countries_of_interest,
                    countriesOther: leadData.countries_other,
                    course: leadData.course,
                    qualifications: buildQualificationsForApi(leadData.qualifications),
                    referredBy: leadData.referred_by,
                    admissionTests: leadData.admission_tests
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Lead updated successfully!');
                navigate('/leads');
            } else {
                setError(data.message || 'Failed to update lead');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Error updating lead:', err);
            setError('Network error. Please check your connection.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    const handleAssignCounselor = async (counselorId) => {
        setAssigningCounselor(true);
        try {
            const response = await fetch(`${API_URL}/leads/${id}/assign-counselor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ counselorId })
            });
            const data = await response.json();
            if (data.success) {
                alert('Counselor assigned successfully!');
                fetchAssignedCounselors();
                setShowCounselorModal(false);
            } else {
                alert(data.message || 'Failed to assign counselor');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        } finally {
            setAssigningCounselor(false);
        }
    };

    const handleRemoveCounselor = async (counselorId) => {
        if (!window.confirm('Are you sure you want to remove this counselor?')) return;
        try {
            const response = await fetch(`${API_URL}/leads/${id}/counselors/${counselorId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('Counselor removed successfully!');
                fetchAssignedCounselors();
            } else {
                alert(data.message || 'Failed to remove counselor');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        }
    };

    const handleRegisterAsStudent = async () => {
        setRegFormError('');
        const applicantInfo = buildApplicantInfoFromLead(leadData);

        if (!canRegisterFromPayment(paymentStatus)) {
            setRegFormError('Payment must be Partially Paid or Paid before registering the student.');
            return;
        }
        if (!applicantInfo.name.trim()) {
            setRegFormError('Lead must have a first name.');
            return;
        }
        if (!applicantInfo.surname.trim()) {
            setRegFormError('Lead must have a last name in the full name field.');
            return;
        }
        if (!applicantInfo.email.trim()) {
            setRegFormError('Lead must have an email address.');
            return;
        }
        if (!applicantInfo.mobile.trim()) {
            setRegFormError('Lead must have a phone number.');
            return;
        }
        if (!applicantInfo.address.trim()) {
            setRegFormError('Lead must have an address.');
            return;
        }

        setRegistering(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/leads/${id}/register-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantInfo })
            });
            const data = await response.json();
            if (data.success) {
                setShowRegisterModal(false);
                navigate(`/edit-student/${data.userId}`);
            } else {
                setRegFormError(data.message || 'Failed to register student');
            }
        } catch (err) {
            setRegFormError('Network error. Please check your connection.');
        } finally {
            setRegistering(false);
        }
    };

    const handleScheduleMeeting = (counselor) => {
        setSelectedCounselorForMeeting(counselor);
        setShowMeetingModal(true);
    };

    const getMeetingStatusColor = (status) => {
        const colors = { 'Scheduled': 'meeting-scheduled', 'Completed': 'meeting-completed', 'Cancelled': 'meeting-cancelled' };
        return colors[status] || 'meeting-scheduled';
    };

    const filteredCounselors = allCounselors.filter(counselor => {
        const isAssigned = assignedCounselors.some(ac => ac.id === counselor.id);
        const matches = counselor.name.toLowerCase().includes(counselorSearchTerm.toLowerCase()) ||
            counselor.email.toLowerCase().includes(counselorSearchTerm.toLowerCase()) ||
            counselor.counselor_id.toLowerCase().includes(counselorSearchTerm.toLowerCase());
        return !isAssigned && matches;
    });

    if (loading) {
        return (
            <ViewModeWrap viewOnly={viewOnly}>
                <Sidebar />
                <div className="main-content" id="mainContent">
                    <Header />
                    <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading lead data...</p></div>
                </div>
            </ViewModeWrap>
        );
    }

    return (
        <ViewModeWrap viewOnly={viewOnly}>
            <Sidebar />
            <div className="main-content" id="mainContent">
                <Header />
                <div className="leads-container">
                    <div className="leads-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faUserPlus} className="page-icon" />
                                {viewOnly ? 'Lead Details' : 'Edit Lead'}
                            </h1>
                        </div>
                        <div className="header-right">
                            <Link to="/leads" className="btn-secondary">
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Back to Leads
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    <div className="lead-summary-card">
                        <div className="summary-row">
                            <div className="summary-item">
                                <span className="summary-label">Lead ID:</span>
                                <span className="lead-id-display">{formatLeadId(leadData.id)}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Walk-in Date:</span>
                                <span className="lead-id-display">{new Date(leadData.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Status:</span>
                                <span className="lead-id-display">{leadStatusLabel(leadData.status)}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Follow-ups:</span>
                                <span className="lead-id-display" style={{ background: '#F47B20', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                    {leadData.follow_up_count || 0}
                                </span>
                            </div>
                            {leadData.is_registered && leadData.registered_at && (
                                <div className="summary-item">
                                    <span className="summary-label">Registered On:</span>
                                    <span className="lead-id-display">{new Date(leadData.registered_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="lead-summary-actions">
                            {leadData.is_registered && leadData.student_user_id && (
                                <Link
                                    to={`/edit-student/${leadData.student_user_id}`}
                                    className="btn-primary btn-register-large"
                                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <FontAwesomeIcon icon={faUserGraduate} />
                                    View Student Profile
                                </Link>
                            )}
                            <button
                                type="button"
                                className="btn-primary btn-register-large"
                                onClick={() => setShowCounselorModal(true)}
                                disabled={leadData.is_registered}
                            >
                                <FontAwesomeIcon icon={faUserTie} />
                                Assign Counselor
                            </button>
                            {!leadData.is_registered ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn-secondary btn-register-large"
                                        onClick={openPaymentModal}
                                        title="Payment Status"
                                    >
                                        <FontAwesomeIcon icon={faMoneyBillWave} />
                                        Payment
                                        <span className={`lead-payment-pill ${paymentStatus === 'Paid' ? 'paid' : paymentStatus === 'Partially Paid' ? 'partial' : ''}`}>{paymentStatus}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-primary btn-register-large"
                                        onClick={() => { setRegFormError(''); setShowRegisterModal(true); }}
                                        disabled={!canRegisterFromPayment(paymentStatus)}
                                        style={{
                                            opacity: canRegisterFromPayment(paymentStatus) ? 1 : 0.55,
                                            cursor: canRegisterFromPayment(paymentStatus) ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faUserCheck} />
                                        Register Student
                                    </button>
                                </>
                            ) : (
                                <div className="registered-status">
                                    <FontAwesomeIcon icon={faUserCheck} className="registered-icon" />
                                    <span>Already Registered</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <form className="lead-form lead-form-container" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h2 className="section-title">Lead Information</h2>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="full_name">Full Name <span className="required">*</span></label>
                                        <input type="text" id="full_name" name="full_name" className="input-field form-control"
                                            value={leadData.full_name} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address <span className="required">*</span></label>
                                        <input type="email" id="email" name="email" className="input-field form-control"
                                            value={leadData.email} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                                        <input type="tel" id="phone" name="phone" className="input-field form-control"
                                            value={leadData.phone} onChange={handleInputChange} required />
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="address">Complete Address <span className="required">*</span></label>
                                        <textarea id="address" name="address" className="input-field form-control" rows="3"
                                            value={leadData.address} onChange={handleInputChange} required></textarea>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="course">Course</label>
                                        <input type="text" id="course" name="course" className="input-field form-control"
                                            value={leadData.course || ''} onChange={handleInputChange}
                                            placeholder="e.g. Computer Science, MBA..." />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="interest">Area of Interest <span className="required">*</span></label>
                                        <input type="text" id="interest" name="interest" className="input-field form-control"
                                            value={leadData.interest || ''} onChange={handleInputChange} required
                                            placeholder="e.g. Business, Engineering, Medicine..." />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="program">Program</label>
                                        <select id="program" name="program" className="input-field form-control"
                                            value={leadData.program || ''} onChange={handleInputChange}>
                                            <option value="">Select a program</option>
                                            <option value="undergraduate">Undergraduate Programs</option>
                                            <option value="graduate">Graduate Programs</option>
                                            <option value="phd">PhD Programs</option>
                                            <option value="scholarship">Scholarship Information</option>
                                            <option value="abroad">Study Abroad</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="institute_name">School/College/Institute Name</label>
                                        <input
                                            type="text"
                                            id="institute_name"
                                            name="institute_name"
                                            className="input-field form-control"
                                            value={leadData.institute_name || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter school, college, or institute name"
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="status">Lead Status <span className="required">*</span></label>
                                        <select id="status" name="status" className="input-field form-control"
                                            value={leadData.status || 'new'} onChange={handleInputChange} required>
                                            {LEAD_STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Countries of Interest */}
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label className="section-label-orange">
                                            <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px' }} />
                                            Countries of Interest
                                        </label>
                                        <CountryMultiSelect
                                            countries={countries}
                                            selected={leadData.countries_of_interest || []}
                                            onToggle={handleCountryToggle}
                                            otherValue={leadData.countries_other || ''}
                                            onOtherChange={(value) => setLeadData(prev => ({ ...prev, countries_other: value }))}
                                        />
                                    </div>
                                </div>

                                {/* Qualification Section */}
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label className="section-label-orange">Qualification</label>
                                        <p className="qualification-prompt">Which qualification have you done?</p>
                                        <div className="countries-checkbox-grid qualification-levels-grid">
                                            {QUALIFICATION_OPTIONS.map(level => {
                                                const isSelected = (leadData.qualifications?.selected || []).includes(level);
                                                return (
                                                    <label
                                                        key={level}
                                                        className={`country-checkbox-item${isSelected ? ' selected' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleQualificationToggle(level)}
                                                        />
                                                        <span>{level}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        {(leadData.qualifications?.selected || []).map(level => (
                                            <div key={level} className="qualification-detail-box">
                                                <h4 className="qualification-detail-title">{level}</h4>

                                                {SUBJECT_GRADE_LEVELS.includes(level) && (
                                                    <div className="qualification-table">
                                                        <div className="qualification-header qualification-header-subjects">
                                                            <span>Subject</span>
                                                            <span>Grade</span>
                                                            <span></span>
                                                        </div>
                                                        {(leadData.qualifications.details[level]?.subjects || []).map((row, index) => (
                                                            <div key={index} className="qualification-row qualification-row-subjects">
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Mathematics"
                                                                    value={row.subject || ''}
                                                                    onChange={(e) => handleSubjectRowChange(level, index, 'subject', e.target.value)}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. A*"
                                                                    value={row.grade || ''}
                                                                    onChange={(e) => handleSubjectRowChange(level, index, 'grade', e.target.value)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="qualification-remove-btn"
                                                                    onClick={() => removeSubjectRow(level, index)}
                                                                    title="Remove row"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button type="button" className="add-subject-btn" onClick={() => addSubjectRow(level)}>
                                                            + Add Subject
                                                        </button>
                                                    </div>
                                                )}

                                                {PERCENTAGE_LEVELS.includes(level) && (
                                                    <div className="qualification-simple-field">
                                                        <label>Percentage</label>
                                                        <input
                                                            type="text"
                                                            className="input-field form-control"
                                                            placeholder="e.g. 85%"
                                                            value={leadData.qualifications.details[level]?.percentage || ''}
                                                            onChange={(e) => handleQualificationDetailChange(level, 'percentage', e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                {CGPA_LEVELS.includes(level) && (
                                                    <div className="qualification-simple-field">
                                                        <label>CGPA / Division</label>
                                                        <input
                                                            type="text"
                                                            className="input-field form-control"
                                                            placeholder="e.g. 3.5 / First Division"
                                                            value={leadData.qualifications.details[level]?.cgpaDivision || ''}
                                                            onChange={(e) => handleQualificationDetailChange(level, 'cgpaDivision', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Referred By */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="referred_by">Referred By</label>
                                        <select
                                            id="referred_by"
                                            name="referred_by"
                                            className="input-field form-control"
                                            value={leadData.referred_by || ''}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">How did you hear about us?</option>
                                            {REFERRED_BY_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* English / Admission Tests */}
                                <div className="col-md-12">
                                    <div className="form-group">
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
                                                        value={leadData.admission_tests?.[key]?.attempted || ''}
                                                        onChange={(e) => handleAdmissionTestChange(key, 'attempted', e.target.value)}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                        <option value="Not Attempted">Not Attempted</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder={key === 'ielts' ? 'e.g. 6.5' : key === 'toefl' ? 'e.g. 90' : key === 'sat' ? 'e.g. 1200' : 'e.g. 310'}
                                                        value={leadData.admission_tests?.[key]?.score || ''}
                                                        onChange={(e) => handleAdmissionTestChange(key, 'score', e.target.value)}
                                                        disabled={leadData.admission_tests?.[key]?.attempted !== 'Yes'}
                                                    />
                                                    <input
                                                        type="date"
                                                        value={leadData.admission_tests?.[key]?.date || ''}
                                                        onChange={(e) => handleAdmissionTestChange(key, 'date', e.target.value)}
                                                        disabled={leadData.admission_tests?.[key]?.attempted !== 'Yes'}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="comments">Counsellor Notes</label>
                                        <textarea id="comments" name="comments" className="input-field form-control" rows="4"
                                            value={leadData.comments || ''} onChange={handleInputChange}
                                            placeholder="Write your notes here..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Link to="/leads" className="btn-secondary">Cancel</Link>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                <FontAwesomeIcon icon={faSave} />
                                {saving ? 'Updating...' : 'Update Lead'}
                            </button>
                        </div>
                    </form>

                    {/* Assigned Counselors Section */}
                    <div className="form-section" style={{ marginTop: '32px' }}>
                        <div className="section-header">
                            <h2 className="section-title">
                                <FontAwesomeIcon icon={faUserTie} style={{ marginRight: '10px' }} />
                                Assigned Counselors
                            </h2>
                        </div>
                        {assignedCounselors.length > 0 ? (
                            <div className="row g-3">
                                {assignedCounselors.map((counselor) => (
                                    <div key={counselor.id} className="col-md-6">
                                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: 'white' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{counselor.name}</h4>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>{counselor.counselor_id}</p>
                                                </div>
                                                <button type="button" className="btn-icon btn-delete"
                                                    onClick={() => handleRemoveCounselor(counselor.id)}
                                                    disabled={leadData.is_registered}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}><strong>Email:</strong> {counselor.email}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}><strong>Experience:</strong> {counselor.experience}</div>
                                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}><strong>Expertise:</strong> {counselor.expertise}</div>
                                            <button type="button" className="btn-primary" style={{ width: '100%' }}
                                                onClick={() => handleScheduleMeeting(counselor)}>
                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                Schedule Meeting
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data-message">
                                <FontAwesomeIcon icon={faUserTie} className="no-data-icon" />
                                <p>No counselors assigned yet.</p>
                                {!leadData.is_registered && (
                                    <button type="button" className="btn-primary" onClick={() => setShowCounselorModal(true)} style={{ marginTop: '15px' }}>
                                        <FontAwesomeIcon icon={faPlus} />
                                        Assign First Counselor
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Scheduled Meetings Section */}
                    {meetings.length > 0 && (
                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <h2 className="section-title">
                                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '10px' }} />
                                Scheduled Meetings
                            </h2>
                            <div className="row g-3">
                                {meetings.map((meeting) => (
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
                                                    <span>{new Date(meeting.meeting_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                                <div className="meeting-info-item">
                                                    <FontAwesomeIcon icon={faClock} className="info-icon-small" />
                                                    <span>{meeting.meeting_time} ({meeting.duration_minutes} minutes)</span>
                                                </div>
                                            </div>
                                            {meeting.notes && <div className="meeting-notes"><strong>Notes:</strong> {meeting.notes}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Follow-up History Section */}
                    <div className="form-section" style={{ marginTop: '32px' }}>
                        <h2 className="section-title">
                            <FontAwesomeIcon icon={faHistory} style={{ marginRight: '10px' }} />
                            Follow-up History
                        </h2>
                        {followUpHistory.length > 0 ? (
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
                                        {followUpHistory.map((followUp) => {
                                            const relatedChanges = leadChanges.filter(c => c.follow_up_id === followUp.id);
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
                                                                        <strong style={{ textTransform: 'capitalize', color: '#F47B20' }}>{change.field_name.replace('_', ' ')}:</strong>
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
                                <p>No follow-up history available.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                REGISTER AS STUDENT MODAL
            ════════════════════════════════════════════════════════════ */}
            {showRegisterModal && (
                <>
                    <div className="modal-backdrop show" onClick={() => !registering && setShowRegisterModal(false)}></div>
                    <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                <div className="modal-header" style={{
                                    background: 'linear-gradient(135deg, #F47B20 0%, #e8660f 100%)',
                                    padding: '20px 28px', borderBottom: 'none'
                                }}>
                                    <div>
                                        <h5 className="modal-title" style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                                            <FontAwesomeIcon icon={faUserCheck} style={{ marginRight: '10px' }} />
                                            Register as Student
                                        </h5>
                                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: '4px 0 0' }}>
                                            Confirm registration using this lead&apos;s details
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close-modal"
                                        onClick={() => !registering && setShowRegisterModal(false)}
                                        disabled={registering}
                                        style={{ color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="modal-body" style={{ padding: '24px 28px' }}>
                                    {regFormError && (
                                        <div style={{
                                            background: '#fee2e2', color: '#991b1b', padding: '12px 16px',
                                            borderRadius: '10px', marginBottom: '16px', border: '1px solid #fecaca',
                                            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            {regFormError}
                                        </div>
                                    )}

                                    <p style={{ fontSize: '15px', color: '#374151', marginBottom: '16px', lineHeight: 1.6 }}>
                                        Are you sure you want to register <strong>{leadData.full_name}</strong> as a student?
                                        A student profile will be created using the lead&apos;s information, and you will be taken to the student edit page to complete any remaining details.
                                    </p>

                                    <div style={{
                                        background: '#f9fafb', padding: '16px', borderRadius: '10px',
                                        border: '1px solid #e5e7eb', fontSize: '13px', color: '#374151'
                                    }}>
                                        <div style={{ marginBottom: '8px' }}><strong>Name:</strong> {leadData.full_name || '—'}</div>
                                        <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {leadData.email || '—'}</div>
                                        <div style={{ marginBottom: '8px' }}><strong>Phone:</strong> {leadData.phone || '—'}</div>
                                        {leadData.course && <div style={{ marginBottom: '8px' }}><strong>Course:</strong> {leadData.course}</div>}
                                        {leadData.institute_name && <div style={{ marginBottom: '8px' }}><strong>School/College/Institute:</strong> {leadData.institute_name}</div>}
                                        {leadData.address && <div><strong>Address:</strong> {leadData.address}</div>}
                                    </div>

                                    <div style={{
                                        marginTop: '16px', background: '#f0f9ff', padding: '14px 16px',
                                        borderRadius: '10px', border: '1px solid #bae6fd', fontSize: '13px', color: '#0c4a6e'
                                    }}>
                                        <FontAwesomeIcon icon={faUserCheck} style={{ marginRight: '8px', color: '#0284c7' }} />
                                        Assigned counselors and meetings will be transferred automatically.
                                        {leadData.invoice_id && selectedInvoice && (
                                            <span style={{ display: 'block', marginTop: '6px', color: '#166534' }}>
                                                <FontAwesomeIcon icon={faLink} style={{ marginRight: '6px' }} />
                                                Invoice <strong>{selectedInvoice.invoice_id}</strong> is linked to this lead.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" className="btn-secondary"
                                        onClick={() => !registering && setShowRegisterModal(false)}
                                        disabled={registering}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleRegisterAsStudent}
                                        disabled={registering}
                                    >
                                        <FontAwesomeIcon icon={faUserCheck} />
                                        {registering ? 'Registering...' : 'Confirm Registration'}
                                    </button>
                                </div>
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
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={faUserTie} style={{ marginRight: '10px' }} />
                                        Assign Counselor to Lead
                                    </h5>
                                    <button type="button" className="btn-close-modal" onClick={() => setShowCounselorModal(false)} disabled={assigningCounselor}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="search-box mb-3" style={{ position: 'relative' }}>
                                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                        <input type="text" className="input-field"
                                            placeholder="Search counselors by name, email, or ID..."
                                            value={counselorSearchTerm}
                                            onChange={(e) => setCounselorSearchTerm(e.target.value)} />
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {filteredCounselors.length > 0 ? (
                                            <div className="row g-3">
                                                {filteredCounselors.map((counselor) => (
                                                    <div key={counselor.id} className="col-12">
                                                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: 'white' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F47B20'}
                                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#F47B20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px' }}>
                                                                            <FontAwesomeIcon icon={faUserTie} />
                                                                        </div>
                                                                        <div>
                                                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{counselor.name}</h4>
                                                                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6b7280' }}>{counselor.counselor_id}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}><strong>Email:</strong> {counselor.email}</div>
                                                                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}><strong>Experience:</strong> {counselor.experience}</div>
                                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}><strong>Expertise:</strong> {counselor.expertise?.substring(0, 100)}{counselor.expertise?.length > 100 ? '...' : ''}</div>
                                                                </div>
                                                                <button type="button" className="btn-primary"
                                                                    onClick={() => handleAssignCounselor(counselor.id)}
                                                                    disabled={assigningCounselor}
                                                                    style={{ marginLeft: '15px' }}>
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                    {assigningCounselor ? 'Assigning...' : 'Assign'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                                <FontAwesomeIcon icon={faUserTie} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                                                <p>{counselorSearchTerm ? 'No counselors found matching your search' : 'All available counselors have been assigned'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Payment Status Modal */}
            {showPaymentModal && (
                <>
                    <div className="modal-backdrop show" onClick={() => !linkingInvoice && !updatingPayment && setShowPaymentModal(false)}></div>
                    <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)', borderBottom: '1px solid #fed7aa' }}>
                                    <h5 className="modal-title" style={{ fontWeight: '700' }}>
                                        <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '10px', color: '#F47B20' }} />
                                        Payment Status
                                        <span style={{
                                            marginLeft: '12px', fontSize: '12px', padding: '3px 10px', borderRadius: '12px',
                                            ...getPaymentStatusStyle(paymentStatus === 'Unpaid' ? 'Pending' : paymentStatus)
                                        }}>
                                            {paymentStatus}
                                        </span>
                                    </h5>
                                    <button type="button" className="btn-close-modal"
                                        onClick={() => !linkingInvoice && !updatingPayment && setShowPaymentModal(false)}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <div className="modal-body" style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
                                    {paymentModalError && (
                                        <div style={{
                                            background: '#fef2f2', color: '#b91c1c', padding: '10px 14px',
                                            borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            {paymentModalError}
                                        </div>
                                    )}

                                    <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
                                        <div><strong>Lead email:</strong> {leadData.email || '—'}</div>
                                        <div style={{ marginTop: '4px' }}>
                                            <strong>Countries of interest:</strong>{' '}
                                            {formatLeadCountries(leadData.countries_of_interest, leadData.countries_other)}
                                        </div>
                                    </div>

                                    <h6 style={{ fontWeight: '700', marginBottom: '12px', color: '#374151' }}>
                                        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ marginRight: '8px', color: '#F47B20' }} />
                                        Invoices matching this email
                                    </h6>

                                    {leadInvoicesLoading ? (
                                        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>Loading invoices…</div>
                                    ) : leadInvoices.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                            <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ fontSize: '32px', opacity: 0.3, marginBottom: '12px' }} />
                                            <p style={{ margin: 0 }}>No student invoices found for <strong>{leadData.email}</strong></p>
                                            <button type="button" className="btn-primary" style={{ marginTop: '16px' }}
                                                onClick={() => { setShowPaymentModal(false); navigate('/finance'); }}>
                                                <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginRight: '8px' }} />
                                                Go to Finance Module
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                            {leadInvoices.map(inv => {
                                                const isSelected = selectedInvoice?.id === inv.id;
                                                const isLinkedElsewhere = inv.is_linked_to_student || inv.is_linked_to_other_lead;
                                                const canSelect = inv.countries_match && (inv.is_linked_to_lead || !isLinkedElsewhere);
                                                return (
                                                    <div key={inv.id} style={{
                                                        border: `2px solid ${isSelected ? '#F47B20' : inv.countries_match ? '#e5e7eb' : '#fecaca'}`,
                                                        borderRadius: '12px', padding: '14px 16px',
                                                        background: isSelected ? '#fff7ed' : inv.countries_match ? 'white' : '#fef2f2',
                                                        opacity: canSelect || isSelected ? 1 : 0.85
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{inv.invoice_id}</span>
                                                                    <span style={{ ...getPaymentStatusStyle(inv.payment_status), padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                                                                        {inv.payment_status}
                                                                    </span>
                                                                    {inv.is_linked_to_lead && (
                                                                        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>Linked</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                                    {new Date(inv.invoice_date).toLocaleDateString()}
                                                                    &nbsp;·&nbsp; PKR {Number(inv.final_amount || 0).toLocaleString()}
                                                                </div>
                                                                {inv.invoice_countries?.length > 0 && (
                                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                                        <strong>Countries:</strong> {inv.invoice_countries.join(', ')}
                                                                    </div>
                                                                )}
                                                                {!inv.countries_match && (
                                                                    <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '8px', fontWeight: '600' }}>
                                                                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '6px' }} />
                                                                        Countries do not match with the lead
                                                                    </div>
                                                                )}
                                                                {isLinkedElsewhere && !inv.is_linked_to_lead && (
                                                                    <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
                                                                        Already linked to another lead or student
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                                {!inv.countries_match ? (
                                                                    <button type="button" className="btn-secondary" style={{ fontSize: '12px' }}
                                                                        onClick={() => { setShowPaymentModal(false); navigate('/finance'); }}>
                                                                        <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginRight: '6px' }} />
                                                                        Finance
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className={isSelected ? 'btn-primary' : 'btn-secondary'}
                                                                        style={{ fontSize: '12px' }}
                                                                        disabled={!canSelect || linkingInvoice || isSelected}
                                                                        onClick={() => handleLinkInvoice(inv)}
                                                                    >
                                                                        {linkingInvoice ? 'Linking…' : isSelected ? 'Selected' : 'Select'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {selectedInvoice && (
                                        <>
                                            <h6 style={{ fontWeight: '700', marginBottom: '12px', color: '#374151', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                                                <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '8px', color: '#16a34a' }} />
                                                Update Payment — {selectedInvoice.invoice_id}
                                            </h6>
                                            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
                                                <div style={{ fontWeight: 600 }}>Final Amount: PKR {Number(selectedInvoice.final_amount || 0).toLocaleString()}</div>
                                                <div style={{ color: '#666', marginTop: '4px' }}>
                                                    Paid: <strong style={{ color: '#16a34a' }}>PKR {Number(selectedInvoice.paid_amount || 0).toLocaleString()}</strong>
                                                    {' · '}Remaining: <strong style={{ color: '#ea580c' }}>
                                                        PKR {Math.max(0, Number(selectedInvoice.final_amount || 0) - Number(selectedInvoice.paid_amount || 0)).toLocaleString()}
                                                    </strong>
                                                    {' · '}Installments: <strong>{invoicePayments.length}</strong>
                                                </div>
                                                <div style={{ color: '#666', marginTop: '4px' }}>
                                                    Lead status: <strong>{paymentStatus}</strong>
                                                    {' '}(from invoice: {selectedInvoice.payment_status})
                                                </div>
                                            </div>
                                            {invoicePayments.length > 0 && (
                                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                                                    {invoicePayments.map((p, idx) => (
                                                        <div key={p.id} style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '8px 12px', borderBottom: idx < invoicePayments.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                            fontSize: '12px'
                                                        }}>
                                                            <span>#{idx + 1} — {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <strong style={{ color: '#16a34a' }}>PKR {Number(p.amount || 0).toLocaleString()}</strong>
                                                                <button type="button" title="View Receipt"
                                                                    onClick={() => navigate(`/payment-receipt/${selectedInvoice.id}/${p.id}`)}
                                                                    style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}>
                                                                    <FontAwesomeIcon icon={faReceipt} />
                                                                </button>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>Payment Status</label>
                                                    <select className="form-control" style={{ marginBottom: 0 }}
                                                        value={paymentForm.paymentStatus}
                                                        onChange={e => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Paid">Paid</option>
                                                        <option value="Partially Paid">Partially Paid</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>This Installment (PKR)</label>
                                                    <input type="number" className="form-control" style={{ marginBottom: 0 }}
                                                        placeholder="0.00" value={paymentForm.installmentAmount}
                                                        onChange={e => setPaymentForm({ ...paymentForm, installmentAmount: e.target.value })} />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>Payment Date</label>
                                                    <input type="date" className="form-control" style={{ marginBottom: 0 }}
                                                        value={paymentForm.paymentDate}
                                                        onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                {['Paid', 'Partially Paid'].includes(selectedInvoice.payment_status) && Number(selectedInvoice.paid_amount) > 0 && (
                                                    <button type="button" className="btn-secondary"
                                                        onClick={() => {
                                                            if (invoicePayments.length === 1) {
                                                                navigate(`/payment-receipt/${selectedInvoice.id}/${invoicePayments[0].id}`);
                                                            } else if (invoicePayments.length > 1) {
                                                                navigate(`/payment-receipt/${selectedInvoice.id}/${invoicePayments[invoicePayments.length - 1].id}`);
                                                            } else {
                                                                navigate(`/payment-receipt/${selectedInvoice.id}`);
                                                            }
                                                        }}>
                                                        <FontAwesomeIcon icon={faReceipt} style={{ marginRight: '6px' }} />
                                                        View Receipt
                                                    </button>
                                                )}
                                                <button type="button" className="btn-primary"
                                                    onClick={handleUpdateInvoicePayment}
                                                    disabled={updatingPayment}>
                                                    <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '8px' }} />
                                                    {updatingPayment
                                                        ? 'Saving…'
                                                        : (parseFloat(paymentForm.installmentAmount) > 0 ? 'Record Payment' : 'Update Status')}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #f3f4f6' }}>
                                    <button type="button" className="btn-secondary"
                                        onClick={() => setShowPaymentModal(false)}
                                        disabled={linkingInvoice || updatingPayment}>
                                        Close
                                    </button>
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
                                    leadId={id}
                                    onClose={() => setShowMeetingModal(false)}
                                    onSuccess={() => { fetchMeetings(); setShowMeetingModal(false); }}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ViewModeWrap>
    );
}