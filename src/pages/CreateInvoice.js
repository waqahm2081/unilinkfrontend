import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import InvoiceDocument from '../components/InvoiceDocument';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar, faTimes, faPlus, faTrash,
  faUser, faUniversity, faBuilding, faArrowLeft,
  faCheck, faHandshake, faUserTie, faPercent,
  faExchangeAlt, faSpinner, faInfoCircle, faMoneyBill,
  faCreditCard, faKeyboard, faDatabase, faToggleOn, faToggleOff,
  faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

/** Nest flat country_services rows into { ...parent, sub_services: [] } sets */
const nestCountryServices = (services) => {
  const list = Array.isArray(services) ? services : [];
  if (list.some(s => Array.isArray(s.sub_services))) {
    return list.map(s => ({
      ...s,
      sub_services: Array.isArray(s.sub_services) ? s.sub_services : []
    }));
  }

  const parents = list.filter(s => s.parent_id == null || s.parent_id === '' || Number(s.parent_id) === 0);
  const children = list.filter(s => s.parent_id != null && s.parent_id !== '' && Number(s.parent_id) !== 0);

  if (children.length === 0) {
    return parents.map(p => ({ ...p, sub_services: [] }));
  }

  return parents
    .map(parent => ({
      ...parent,
      sub_services: children
        .filter(c => Number(c.parent_id) === Number(parent.id))
        .sort((a, b) => (Number(a.display_order) - Number(b.display_order)) || (a.id - b.id))
    }))
    .sort((a, b) => (Number(a.display_order) - Number(b.display_order)) || (a.id - b.id));
};

const INVOICE_TYPES = [
  { value: 'Student',               label: 'Student',          icon: faUser,       desc: 'Invoice for student services' },
  { value: 'University Commission', label: 'Uni. Commission',  icon: faUniversity, desc: 'Commission from university' },
  { value: 'Agent Commission',      label: 'Agent Commission', icon: faHandshake,  desc: 'Commission payout to agent' },
];

const CURRENCIES = [
  { value: 'PKR', label: 'PKR — Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { value: 'USD', label: 'USD — US Dollar',        symbol: '$', flag: '🇺🇸' },
  { value: 'GBP', label: 'GBP — British Pound',   symbol: '£', flag: '🇬🇧' },
  { value: 'EUR', label: 'EUR — Euro',              symbol: '€', flag: '🇪🇺' },
];

// ── Reusable Student Selector Component ──
// mode: 'db' | 'manual'
// onDbSelect: callback(student) when selected from DB
// onManualChange: callback(fields) when manual fields change
// students: full students array for search
// dbValue: currently selected student object or null
// manualValue: { name, email, mobile, country }
// label: label string
// required: bool
function StudentSelector({
  mode, onModeChange,
  students, dbValue, onDbSelect,
  manualValue, onManualChange,
  label = 'Student', required = false,
  showModeToggle = true,
}) {
  const [search, setSearch]         = useState('');
  const [results, setResults]       = useState([]);
  const [showDrop, setShowDrop]     = useState(false);

  // Keep search text in sync when dbValue changes externally
  useEffect(() => {
    if (mode === 'db' && dbValue) {
      setSearch([dbValue.name, dbValue.middle_name, dbValue.surname].filter(Boolean).join(' '));
    }
    if (mode === 'db' && !dbValue) {
      setSearch('');
    }
  }, [dbValue, mode]);

  const handleSearch = (val) => {
    setSearch(val);
    if (val.length < 2) { setResults([]); setShowDrop(false); return; }
    const r = students.filter(s =>
      `${s.name} ${s.middle_name || ''} ${s.surname}`.toLowerCase().includes(val.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(val.toLowerCase()) ||
      s.email?.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 8);
    setResults(r);
    setShowDrop(true);
  };

  const handleSelect = (s) => {
    onDbSelect(s);
    setSearch([s.name, s.middle_name, s.surname].filter(Boolean).join(' '));
    setShowDrop(false);
    setResults([]);
  };

  const clearSelection = () => {
    onDbSelect(null);
    setSearch('');
    setResults([]);
    setShowDrop(false);
  };

  return (
    <div>
      {showModeToggle && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button type="button" onClick={() => { onModeChange('db'); clearSelection(); }}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
              border: `1.5px solid ${mode === 'db' ? '#F47B20' : '#e5e7eb'}`,
              background: mode === 'db' ? '#FFF3E0' : '#fafafa',
              color: mode === 'db' ? '#E65100' : '#666',
              fontWeight: mode === 'db' ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', transition: 'all 0.2s'
            }}>
            <FontAwesomeIcon icon={faDatabase} />
            From Database
            {mode === 'db' && <FontAwesomeIcon icon={faCheck} style={{ fontSize: '10px' }} />}
          </button>
          <button type="button" onClick={() => { onModeChange('manual'); clearSelection(); }}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
              border: `1.5px solid ${mode === 'manual' ? '#6A1B9A' : '#e5e7eb'}`,
              background: mode === 'manual' ? '#F3E5F5' : '#fafafa',
              color: mode === 'manual' ? '#6A1B9A' : '#666',
              fontWeight: mode === 'manual' ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', transition: 'all 0.2s'
            }}>
            <FontAwesomeIcon icon={faKeyboard} />
            Manual Entry
            {mode === 'manual' && <FontAwesomeIcon icon={faCheck} style={{ fontSize: '10px' }} />}
          </button>
        </div>
      )}

      {mode === 'db' ? (
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#333' }}>
            {label} {required && <span style={{ color: 'red' }}>*</span>}
          </label>
          <input type="text" className="input-field"
            placeholder="Search by name, student ID, or email..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => search.length >= 2 && setShowDrop(true)}
          />
          {showDrop && results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '280px', overflowY: 'auto' }}>
              {results.map(s => (
                <div key={s.id} onClick={() => handleSelect(s)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF3E0'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '13px' }}>
                    {[s.name, s.middle_name, s.surname].filter(Boolean).join(' ')}
                  </div>
                  <div style={{ color: '#888', fontSize: '11px' }}>{s.student_id} · {s.email} · {s.country}</div>
                </div>
              ))}
            </div>
          )}
          {dbValue && (
            <div style={{ marginTop: '10px', background: '#FFF8F0', border: '1px solid #FFE0B2', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Student ID', value: dbValue.student_id },
                  { label: 'Email',      value: dbValue.email },
                  { label: 'Mobile',     value: dbValue.mobile },
                  { label: 'Country',    value: dbValue.country },
                  { label: 'Status',     value: dbValue.status },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>{f.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#333' }}>{f.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px', color: '#333' }}>
            {label} Details {required && <span style={{ color: 'red' }}>*</span>}
            <span style={{ marginLeft: '8px', background: '#F3E5F5', color: '#6A1B9A', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
              Manual Entry
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#FAF5FF', border: '1px solid #E1BEE7', borderRadius: '10px', padding: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', color: '#555' }}>Full Name <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="input-field" placeholder="e.g. John Smith"
                value={manualValue?.name || ''} onChange={e => onManualChange({ ...manualValue, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', color: '#555' }}>Email</label>
              <input type="email" className="input-field" placeholder="student@email.com"
                value={manualValue?.email || ''} onChange={e => onManualChange({ ...manualValue, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', color: '#555' }}>Mobile</label>
              <input type="text" className="input-field" placeholder="+92..."
                value={manualValue?.mobile || ''} onChange={e => onManualChange({ ...manualValue, mobile: e.target.value })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── University Commission Student Card ──
function CommissionStudentCard({ entry, index, students, onUpdate, onRemove }) {
  const [mode, setMode] = useState(entry.isManual ? 'manual' : 'db');

  const handleModeChange = (newMode) => {
    setMode(newMode);
    onUpdate(index, {
      ...entry,
      isManual: newMode === 'manual',
      studentId: null, studentName: '', studentRefId: '', studentEmail: '', studentMobile: '',
    });
  };

  const handleDbSelect = (s) => {
    if (!s) {
      onUpdate(index, { ...entry, studentId: null, studentName: '', studentRefId: '', studentEmail: '', studentMobile: '' });
      return;
    }
    onUpdate(index, {
      ...entry,
      studentId:    s.id,
      studentName:  [s.name, s.middle_name, s.surname].filter(Boolean).join(' '),
      studentRefId: s.student_id,
      studentEmail: s.email || '',
      studentMobile:s.mobile || '',
      isManual:     false,
    });
  };

  const handleManualChange = (fields) => {
    onUpdate(index, { ...entry, studentName: fields.name || '', studentEmail: fields.email || '', studentMobile: fields.mobile || '', isManual: true });
  };

  const dbStudent = entry.studentId ? {
    id: entry.studentId, name: entry.studentName, student_id: entry.studentRefId,
    email: entry.studentEmail, mobile: entry.studentMobile, middle_name: '', surname: '',
    country: '', status: ''
  } : null;

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '18px', marginBottom: '14px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#F47B20', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
            {index + 1}
          </span>
          Student Commission
        </div>
        {index > 0 && (
          <button type="button" onClick={() => onRemove(index)}
            style={{ background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '5px 9px', cursor: 'pointer', fontSize: '12px' }}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>

      <StudentSelector
        mode={mode} onModeChange={handleModeChange}
        students={students}
        dbValue={mode === 'db' ? dbStudent : null}
        onDbSelect={handleDbSelect}
        manualValue={{ name: entry.studentName, email: entry.studentEmail, mobile: entry.studentMobile }}
        onManualChange={handleManualChange}
        label="Student" required={false}
        showModeToggle={true}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '12px', color: '#555' }}>University Name <span style={{ color: 'red' }}>*</span></label>
          <input type="text" className="input-field" placeholder="e.g. University of London"
            value={entry.universityName || ''} onChange={e => onUpdate(index, { ...entry, universityName: e.target.value })} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '12px', color: '#555' }}>Commission Reference</label>
          <input type="text" className="input-field" placeholder="e.g. COM-2024-001"
            value={entry.commissionReference || ''} onChange={e => onUpdate(index, { ...entry, commissionReference: e.target.value })} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '12px', color: '#555' }}>Commission Amount (PKR) <span style={{ color: 'red' }}>*</span></label>
          <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01"
            value={entry.commissionAmount || ''} onChange={e => onUpdate(index, { ...entry, commissionAmount: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function CreateInvoice() {
  const navigate = useNavigate();

  const [invoiceType, setInvoiceType]   = useState('Student');
  const [invoiceDate, setInvoiceDate]   = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate]           = useState('');
  const [notes, setNotes]               = useState('');

  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [bankAccountId, setBankAccountId] = useState('');

  const [selectedCurrency, setSelectedCurrency] = useState('PKR');
  const [exchangeRate, setExchangeRate]           = useState(1);
  const [rateLoading, setRateLoading]             = useState(false);
  const [rateError, setRateError]                 = useState('');
  const [rateLastFetched, setRateLastFetched]     = useState(null);
  const [showConvertedCurrency, setShowConvertedCurrency] = useState(true);

  // ── Student invoice ──
  const [studentMode, setStudentMode]           = useState('db'); // 'db' | 'manual'
  const [selectedStudent, setSelectedStudent]   = useState(null);
  const [manualStudent, setManualStudent]       = useState({ name: '', email: '', mobile: '' });
  const [countries, setCountries]               = useState([]);
  const [selectedCountryIds, setSelectedCountryIds] = useState([]);
  const [countryServicesMap, setCountryServicesMap]   = useState({});
  const [selectedCountryServices, setSelectedCountryServices] = useState([]);

  // ── University Commission — multi-student ──
  const emptyCommissionEntry = () => ({
    isManual: false, studentId: null, studentName: '', studentRefId: '',
    studentEmail: '', studentMobile: '', universityName: '', commissionReference: '', commissionAmount: '',
  });
  const [commissionStudents, setCommissionStudents] = useState([emptyCommissionEntry()]);

  // ── Agent Commission ──
  const [agents, setAgents]               = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agentCommissionPercent, setAgentCommissionPercent] = useState('');
  const [agentStudentMode, setAgentStudentMode] = useState('db');
  const [agentStudentSearch, setAgentStudentSearch] = useState('');
  const [agentStudentResults, setAgentStudentResults] = useState([]);
  const [showAgentStudentDropdown, setShowAgentStudentDropdown] = useState(false);
  const [selectedAgentStudents, setSelectedAgentStudents] = useState([]);

  // ── Amounts ──
  const [baseAmount, setBaseAmount] = useState('');
  const [discount, setDiscount]     = useState('0');
  const [gstPercent, setGstPercent] = useState('10');
  const [extraServices, setExtraServices] = useState([]);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [students, setStudents]         = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // ── Computed ──
  const base  = parseFloat(baseAmount) || 0;
  const disc  = parseFloat(discount)   || 0;
  const gst   = parseFloat(gstPercent) || 0;
  const extraServicesTotal = extraServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

  const agentCommissionAmount = invoiceType === 'Agent Commission'
    ? base * (parseFloat(agentCommissionPercent) || 0) / 100 : 0;

  const gstAmount = invoiceType !== 'Agent Commission'
    ? (base + extraServicesTotal) * gst / 100 : 0;

  // For University Commission, total = sum of all student commission amounts
  const commissionTotal = commissionStudents.reduce((sum, s) => sum + (parseFloat(s.commissionAmount) || 0), 0);

  const finalAmountPKR = invoiceType === 'Agent Commission'
    ? agentCommissionAmount
    : invoiceType === 'University Commission'
      ? commissionTotal
      : Math.max(0, base + extraServicesTotal + gstAmount - disc);

  const convertedAmount = selectedCurrency === 'PKR' || exchangeRate <= 0
    ? null : finalAmountPKR / exchangeRate;

  const currencyInfo = CURRENCIES.find(c => c.value === selectedCurrency) || CURRENCIES[0];
  const isPKR        = selectedCurrency === 'PKR';
  const isAgent      = invoiceType === 'Agent Commission';
  const isCommission = invoiceType === 'University Commission';
  const isStudent    = invoiceType === 'Student';

  // ── Currency ──
  const fetchExchangeRate = useCallback(async (currency) => {
    if (currency === 'PKR') { setExchangeRate(1); setRateError(''); setRateLastFetched(null); return; }
    setRateLoading(true); setRateError('');
    try {
      const res  = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      const data = await res.json();
      if (data?.rates?.PKR) { setExchangeRate(data.rates.PKR); setRateLastFetched(new Date()); return; }
      throw new Error('Rate not found');
    } catch {
      try {
        const res2  = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        const data2 = await res2.json();
        if (data2?.rates?.PKR) { setExchangeRate(data2.rates.PKR); setRateLastFetched(new Date()); return; }
        throw new Error('Fallback failed');
      } catch { setRateError('Could not fetch live rate. Enter rate manually.'); }
    } finally { setRateLoading(false); }
  }, []);

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    fetchExchangeRate(currency);
  };

  useEffect(() => {
    fetchBankAccounts();
    fetchStudents();
    fetchAgents();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res  = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      if (data.success) setCountries(data.countries.filter(c => c.status === 'Active'));
    } catch { console.error('countries err'); }
  };

  const clearCountrySelection = () => {
    setSelectedCountryIds([]);
    setCountryServicesMap({});
    setSelectedCountryServices([]);
  };

  const getSelectedCountryNames = () =>
    selectedCountryIds
      .map(id => countries.find(c => c.id === id)?.country_name)
      .filter(Boolean);

  const fetchBankAccounts = async () => {
    try {
      const res  = await fetch(`${API_URL}/finance/bank-accounts`);
      const data = await res.json();
      if (data.success) setBankAccounts(data.accounts.filter(a => a.status === 'Active'));
    } catch { console.error('bank accounts err'); }
  };

  const fetchStudents = async () => {
    try {
      const res  = await fetch(`${API_URL}/students`);
      const data = await res.json();
      if (data.success) setStudents(data.students);
    } catch { console.error('students err'); }
  };

  const fetchAgents = async () => {
    try {
      const res  = await fetch(`${API_URL}/finance/agents`);
      const data = await res.json();
      if (data.success) setAgents(data.agents.filter(a => a.status === 'Active'));
    } catch { console.error('agents err'); }
  };

  // ── Student selection (Student invoice) ──
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    clearCountrySelection();
  };

  const buildSetSelection = (set, country) => {
    const entries = [{
      id: set.id,
      service_name: set.service_name,
      country_id: country.id,
      country_name: country.country_name,
      is_parent: true,
      parent_service_id: null,
      parent_service_name: null,
    }];
    (set.sub_services || []).forEach(sub => {
      entries.push({
        id: sub.id,
        service_name: sub.service_name,
        country_id: country.id,
        country_name: country.country_name,
        is_parent: false,
        parent_service_id: set.id,
        parent_service_name: set.service_name,
      });
    });
    return entries;
  };

  const handleCountryToggle = async (country) => {
    const isSelected = selectedCountryIds.includes(country.id);
    if (isSelected) {
      setSelectedCountryIds(prev => prev.filter(id => id !== country.id));
      setCountryServicesMap(prev => {
        const next = { ...prev };
        delete next[country.id];
        return next;
      });
      setSelectedCountryServices(prev => prev.filter(s => s.country_id !== country.id));
      return;
    }

    setSelectedCountryIds(prev => [...prev, country.id]);
    try {
      const svcRes  = await fetch(`${API_URL}/countries/${country.id}/services`);
      const svcData = await svcRes.json();
      if (svcData.success) {
        const raw = Array.isArray(svcData.flatServices) && svcData.flatServices.length
          ? svcData.flatServices
          : (svcData.services || []);
        const services = nestCountryServices(raw);
        setCountryServicesMap(prev => ({ ...prev, [country.id]: services }));
      }
    } catch { console.error('country services err'); }
  };

  const isSetSelected = (setId, countryId) =>
    selectedCountryServices.some(s => s.id === setId && s.country_id === countryId && s.is_parent);

  const isSubSelected = (subId, countryId) =>
    selectedCountryServices.some(s => s.id === subId && s.country_id === countryId && !s.is_parent);

  const toggleServiceSet = (set, country) => {
    setSelectedCountryServices(prev => {
      const already = prev.some(s => s.id === set.id && s.country_id === country.id && s.is_parent);
      if (already) {
        // Remove parent + all its children for this set
        return prev.filter(s =>
          !(s.country_id === country.id && (s.id === set.id || s.parent_service_id === set.id))
        );
      }
      return [...prev, ...buildSetSelection(set, country)];
    });
  };

  const toggleSubService = (sub, set, country) => {
    setSelectedCountryServices(prev => {
      // Parent set must be selected first
      if (!prev.some(s => s.id === set.id && s.country_id === country.id && s.is_parent)) {
        return prev;
      }
      const exists = prev.some(s => s.id === sub.id && s.country_id === country.id && !s.is_parent);
      if (exists) {
        return prev.filter(s => !(s.id === sub.id && s.country_id === country.id));
      }
      return [...prev, {
        id: sub.id,
        service_name: sub.service_name,
        country_id: country.id,
        country_name: country.country_name,
        is_parent: false,
        parent_service_id: set.id,
        parent_service_name: set.service_name,
      }];
    });
  };

  // ── Commission students CRUD ──
  const addCommissionStudent  = () => setCommissionStudents(prev => [...prev, emptyCommissionEntry()]);
  const removeCommissionStudent = (idx) => setCommissionStudents(prev => prev.filter((_, i) => i !== idx));
  const updateCommissionStudent = (idx, updated) => setCommissionStudents(prev => prev.map((s, i) => i === idx ? updated : s));

  // ── Agent students ──
  const handleAgentStudentSearch = (val) => {
    setAgentStudentSearch(val);
    if (val.length < 2) { setAgentStudentResults([]); setShowAgentStudentDropdown(false); return; }
    if (agentStudentMode === 'db') {
      const alreadyIds = selectedAgentStudents.filter(s => !s.isManual).map(s => s.id);
      const r = students.filter(s =>
        !alreadyIds.includes(s.id) &&
        (`${s.name} ${s.middle_name || ''} ${s.surname}`.toLowerCase().includes(val.toLowerCase()) ||
         s.student_id?.toLowerCase().includes(val.toLowerCase()))
      ).slice(0, 8);
      setAgentStudentResults(r);
      setShowAgentStudentDropdown(true);
    }
  };

  const addAgentStudentFromDb = (student) => {
    setSelectedAgentStudents(prev => [...prev, {
      id: student.id, isManual: false,
      student_name:   [student.name, student.middle_name, student.surname].filter(Boolean).join(' '),
      student_ref_id: student.student_id,
      student_email:  student.email || '',
      student_mobile: student.mobile || '',
      student_country:student.country || '',
    }]);
    setAgentStudentSearch('');
    setAgentStudentResults([]);
    setShowAgentStudentDropdown(false);
  };

  const addManualAgentStudent = () => {
    setSelectedAgentStudents(prev => [...prev, {
      id: `manual_${Date.now()}`, isManual: true,
      student_name: '', student_ref_id: '', student_email: '', student_mobile: '', student_country: ''
    }]);
  };

  const updateManualAgentStudent = (id, field, value) =>
    setSelectedAgentStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const removeAgentStudent = (id) => setSelectedAgentStudents(prev => prev.filter(s => s.id !== id));

  const addExtraService    = () => setExtraServices(prev => [...prev, { id: Date.now(), name: '', price: '' }]);
  const updateExtraService = (id, field, value) =>
    setExtraServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeExtraService = (id) => setExtraServices(prev => prev.filter(s => s.id !== id));

  const handleInvoiceTypeChange = (type) => {
    setInvoiceType(type);
    setSelectedStudent(null);
    setManualStudent({ name: '', email: '', mobile: '' });
    setStudentMode('db');
    clearCountrySelection();
    setSelectedAgentStudents([]);
    setCommissionStudents([emptyCommissionEntry()]);
  };

  const getValidationError = () => {
    if (!invoiceDate) return 'Please fill in invoice date';
    if (paymentMethod === 'bank' && !bankAccountId) return 'Please select a bank account';

    if (isStudent) {
      if (studentMode === 'db' && !selectedStudent) return 'Please select a student';
      if (studentMode === 'manual' && !manualStudent.name?.trim()) return 'Please enter student name';
    }
    if (isCommission) {
      for (let i = 0; i < commissionStudents.length; i++) {
        const s = commissionStudents[i];
        if (!s.universityName?.trim()) return `Student ${i + 1}: University name is required`;
        if (!s.commissionAmount || parseFloat(s.commissionAmount) <= 0) return `Student ${i + 1}: Commission amount is required`;
        if (!s.isManual && !s.studentId && !s.studentName) return `Student ${i + 1}: Please select or enter a student`;
        if (s.isManual && !s.studentName?.trim()) return `Student ${i + 1}: Please enter student name`;
      }
    }
    if (isAgent && !selectedAgentId) return 'Please select an agent';
    if (isAgent && !agentCommissionPercent) return 'Please enter agent commission percentage';
    if (selectedCurrency !== 'PKR' && (!exchangeRate || exchangeRate <= 0)) {
      return 'Please enter a valid exchange rate';
    }
    return '';
  };

  const canPreviewInvoice = !getValidationError();

  const buildPreviewData = () => {
    const bank = bankAccounts.find(b => b.id === parseInt(bankAccountId));
    const agent = agents.find(a => a.id === parseInt(selectedAgentId));
    const studentName = isStudent
      ? (studentMode === 'db' && selectedStudent
        ? [selectedStudent.name, selectedStudent.middle_name, selectedStudent.surname].filter(Boolean).join(' ')
        : (manualStudent.name || ''))
      : '';
    const studentRef = isStudent && studentMode === 'db' && selectedStudent ? selectedStudent.student_id : null;
    const studentEmail = isStudent
      ? (studentMode === 'db' && selectedStudent ? (selectedStudent.email || '') : (manualStudent.email || ''))
      : '';
    const studentMobile = isStudent
      ? (studentMode === 'db' && selectedStudent ? (selectedStudent.mobile || '') : (manualStudent.mobile || ''))
      : '';

    return {
      invoice: {
        invoice_id: 'DRAFT',
        invoice_type: invoiceType,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        payment_method: paymentMethod,
        payment_status: 'Pending',
        account_name: bank?.account_name || null,
        bank_name: bank?.bank_name || null,
        account_number: bank?.account_number || null,
        iban: bank?.iban || null,
        student_name: studentName || null,
        student_ref_id: studentRef,
        student_email: studentEmail || null,
        student_mobile: studentMobile || null,
        student_country: isStudent ? (getSelectedCountryNames().join(', ') || null) : null,
        agent_name: agent?.agent_name || null,
        agent_company: agent?.company_name || null,
        selected_currency: selectedCurrency,
        exchange_rate: isPKR ? 1 : exchangeRate,
        show_converted_currency: !isPKR && showConvertedCurrency ? 1 : 0,
        base_amount: base,
        discount: disc,
        gst_percent: isAgent ? 0 : gst,
        gst_amount: isAgent ? 0 : gstAmount,
        extra_services_total: extraServicesTotal,
        final_amount: finalAmountPKR,
        paid_amount: 0,
        notes: notes || null,
        agent_commission_amount: agentCommissionAmount,
        agent_commission_percent: parseFloat(agentCommissionPercent) || 0,
      },
      extraServices: extraServices.filter(s => s.name).map(s => ({
        service_name: s.name,
        price: parseFloat(s.price) || 0,
      })),
      countryServices: selectedCountryServices.map(s => ({
        id: s.id,
        country_service_id: s.id,
        service_name: s.service_name,
        country_id: s.country_id,
        country_name: s.country_name,
        is_parent: s.is_parent ? 1 : 0,
        parent_service_id: s.parent_service_id || null,
        parent_service_name: s.parent_service_name || null,
      })),
      agentStudents: selectedAgentStudents.map(s => ({
        student_name: s.student_name,
        student_ref_id: s.student_ref_id || null,
        is_manual: s.isManual,
      })),
      commissionStudents: commissionStudents.map(s => ({
        student_name: s.studentName,
        student_ref_id: s.studentRefId || null,
        university_name: s.universityName,
        commission_reference: s.commissionReference,
        commission_amount: parseFloat(s.commissionAmount) || 0,
      })),
      payments: [],
    };
  };

  const handleSubmit = async () => {
    setError('');
    const validationError = getValidationError();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const payload = {
        invoiceType,
        invoiceDate,
        dueDate: dueDate || null,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' && bankAccountId ? parseInt(bankAccountId) : null,

        // Student invoice
        studentId:        isStudent && studentMode === 'db' && selectedStudent ? selectedStudent.id : null,
        isManualStudent:  isStudent && studentMode === 'manual',
        manualStudentName:   isStudent && studentMode === 'manual' ? manualStudent.name : null,
        manualStudentEmail:  isStudent && studentMode === 'manual' ? manualStudent.email : null,
        manualStudentMobile: isStudent && studentMode === 'manual' ? manualStudent.mobile : null,
        manualStudentCountry:isStudent ? getSelectedCountryNames().join(', ') || null : null,
        selectedCountries: isStudent ? selectedCountryIds.map(id => {
          const c = countries.find(x => x.id === id);
          return c ? { id: c.id, country_name: c.country_name } : null;
        }).filter(Boolean) : [],

        // University Commission — multi-student
        commissionStudents: isCommission ? commissionStudents.map(s => ({
          isManual:           s.isManual,
          studentId:          s.isManual ? null : (s.studentId || null),
          studentName:        s.studentName || '',
          studentRefId:       s.isManual ? null : (s.studentRefId || null),
          studentEmail:       s.studentEmail || null,
          studentMobile:      s.studentMobile || null,
          universityName:     s.universityName || null,
          commissionReference:s.commissionReference || null,
          commissionAmount:   parseFloat(s.commissionAmount) || 0,
        })) : [],
        universityName:      null,
        commissionReference: null,

        // Agent Commission
        agentId: isAgent ? parseInt(selectedAgentId) : null,
        agentCommissionPercent: isAgent ? parseFloat(agentCommissionPercent) : null,
        agentStudents: isAgent ? selectedAgentStudents.map(s => ({
          id:             s.isManual ? null : s.id,
          isManual:       s.isManual,
          student_name:   s.student_name,
          student_ref_id: s.student_ref_id || null,
          student_email:  s.student_email || null,
          student_mobile: s.student_mobile || null,
          student_country:s.student_country || null,
        })) : [],

        baseAmount:     parseFloat(baseAmount) || 0,
        discount:       parseFloat(discount) || 0,
        gstPercent:     isAgent ? 0 : parseFloat(gstPercent) || 0,
        gstAmount:      isAgent ? 0 : gstAmount,
        extraServices:  extraServices.filter(s => s.name).map(s => ({ name: s.name, price: parseFloat(s.price) || 0 })),
        selectedCountryServices: selectedCountryServices.map(s => ({
          id: s.id,
          service_name: s.service_name,
          country_id: s.country_id,
          country_name: s.country_name,
          is_parent: !!s.is_parent,
          parent_service_id: s.parent_service_id || null,
          parent_service_name: s.parent_service_name || null,
        })),
        finalAmount:    finalAmountPKR,
        notes,
        selectedCurrency,
        exchangeRate:   isPKR ? 1 : exchangeRate,
        convertedAmount: isPKR ? null : convertedAmount,
        showConvertedCurrency: !isPKR ? showConvertedCurrency : true,
      };

      const res  = await fetch(`${API_URL}/finance/invoices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) navigate('/finance/invoices');
      else setError(data.message || 'Failed to create invoice');
    } catch { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const sectionStyle = {
    background: '#fff', borderRadius: '12px', padding: '24px',
    border: '1px solid #e5e7eb', marginBottom: '20px'
  };
  const sectionTitle = {
    fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
    marginBottom: '20px', paddingBottom: '10px',
    borderBottom: '2px solid #F47B20', display: 'flex', alignItems: 'center', gap: '8px'
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="leads-container">
          <div className="leads-header">
            <div className="header-left">
              <button className="btn-secondary" onClick={() => navigate('/finance/invoices')}
                style={{ marginRight: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="page-icon" />
                Create New Invoice
              </h1>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div className="row">
            <div className="col-md-8">

              {/* ── Invoice Type ── */}
              <div style={sectionStyle}>
                <div style={sectionTitle}>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#F47B20' }} />
                  Invoice Type
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {INVOICE_TYPES.map(type => (
                    <label key={type.value} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', flex: 1,
                      border: `2px solid ${invoiceType === type.value ? '#F47B20' : '#e5e7eb'}`,
                      background: invoiceType === type.value ? '#FFF3E0' : '#fafafa', transition: 'all 0.2s'
                    }}>
                      <input type="radio" name="invoiceType" value={type.value}
                        checked={invoiceType === type.value} onChange={() => handleInvoiceTypeChange(type.value)}
                        style={{ display: 'none' }} />
                      <FontAwesomeIcon icon={type.icon}
                        style={{ fontSize: '20px', color: invoiceType === type.value ? '#F47B20' : '#bbb' }} />
                      <span style={{ fontWeight: invoiceType === type.value ? 700 : 500, color: invoiceType === type.value ? '#E65100' : '#555', fontSize: '13px' }}>
                        {type.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#aaa', textAlign: 'center' }}>{type.desc}</span>
                    </label>
                  ))}
                </div>
                {isAgent && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FFF3E0', borderRadius: '8px', border: '1px solid #FFE0B2', fontSize: '12px', color: '#E65100' }}>
                    ⚠️ Agent Commission invoices are recorded as <strong>debit</strong> (outgoing payment).
                  </div>
                )}
              </div>

              {/* ── Invoice Details ── */}
              <div style={sectionStyle}>
                <div style={sectionTitle}>
                  <FontAwesomeIcon icon={faBuilding} style={{ color: '#F47B20' }} />
                  Invoice Details
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Invoice Date <span style={{ color: 'red' }}>*</span></label>
                      <input type="date" className="input-field" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Payment Method <span style={{ color: 'red' }}>*</span></label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: paymentMethod === 'bank' ? '12px' : '0' }}>
                        <button type="button" onClick={() => setPaymentMethod('bank')}
                          style={{ flex: 1, padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${paymentMethod === 'bank' ? '#F47B20' : '#e5e7eb'}`, background: paymentMethod === 'bank' ? '#FFF3E0' : '#fafafa', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                          <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '18px', color: paymentMethod === 'bank' ? '#F47B20' : '#bbb' }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: paymentMethod === 'bank' ? '#E65100' : '#555' }}>Bank Transfer</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>Select a bank account</div>
                          </div>
                          {paymentMethod === 'bank' && <FontAwesomeIcon icon={faCheck} style={{ marginLeft: 'auto', color: '#F47B20', fontSize: '14px' }} />}
                        </button>
                        <button type="button" onClick={() => { setPaymentMethod('cash'); setBankAccountId(''); }}
                          style={{ flex: 1, padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${paymentMethod === 'cash' ? '#4CAF50' : '#e5e7eb'}`, background: paymentMethod === 'cash' ? '#E8F5E9' : '#fafafa', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                          <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '18px', color: paymentMethod === 'cash' ? '#4CAF50' : '#bbb' }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: paymentMethod === 'cash' ? '#2E7D32' : '#555' }}>Cash</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>No bank account needed</div>
                          </div>
                          {paymentMethod === 'cash' && <FontAwesomeIcon icon={faCheck} style={{ marginLeft: 'auto', color: '#4CAF50', fontSize: '14px' }} />}
                        </button>
                      </div>
                      {paymentMethod === 'bank' && (
                        <select className="input-field" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} style={{ marginBottom: 0 }}>
                          <option value="">Select Bank Account</option>
                          {bankAccounts.map(ba => (
                            <option key={ba.id} value={ba.id}>{ba.account_name} — {ba.bank_name} ({ba.currency})</option>
                          ))}
                        </select>
                      )}
                      {paymentMethod === 'cash' && (
                        <div style={{ padding: '10px 14px', background: '#E8F5E9', borderRadius: '8px', border: '1px solid #A5D6A7', fontSize: '12px', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FontAwesomeIcon icon={faMoneyBill} />
                          Cash payment — this will not affect any bank account balance.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Currency ── */}
              <div style={sectionStyle}>
                <div style={sectionTitle}>
                  <FontAwesomeIcon icon={faExchangeAlt} style={{ color: '#F47B20' }} />
                  Invoice Currency
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  {CURRENCIES.map(cur => (
                    <button key={cur.value} type="button" onClick={() => handleCurrencyChange(cur.value)}
                      style={{ flex: 1, padding: '12px 8px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${selectedCurrency === cur.value ? '#F47B20' : '#e5e7eb'}`, background: selectedCurrency === cur.value ? '#FFF3E0' : '#fafafa', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '20px' }}>{cur.flag}</span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: selectedCurrency === cur.value ? '#E65100' : '#333' }}>{cur.value}</span>
                      <span style={{ fontSize: '10px', color: '#888' }}>{cur.symbol}</span>
                    </button>
                  ))}
                </div>

                {!isPKR && (
                  <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#333', margin: 0 }}>
                        Exchange Rate — 1 {selectedCurrency} = <span style={{ color: '#F47B20' }}>? PKR</span>
                      </label>
                      <button type="button" onClick={() => fetchExchangeRate(selectedCurrency)} disabled={rateLoading}
                        style={{ background: '#F47B20', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        {rateLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Fetching...</> : <><FontAwesomeIcon icon={faExchangeAlt} /> Refresh Rate</>}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>1 {selectedCurrency} =</span>
                      <input type="number" className="input-field" value={exchangeRate}
                        onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)}
                        min="0" step="0.0001" style={{ margin: 0, flex: 1 }} />
                      <span style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>PKR</span>
                    </div>
                    {rateError && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#c62828', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FontAwesomeIcon icon={faInfoCircle} /> {rateError}
                      </div>
                    )}
                    {rateLastFetched && !rateError && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                        ✓ Live rate fetched at {rateLastFetched.toLocaleTimeString()}
                      </div>
                    )}

                    {/* ── Show Converted Currency Toggle ── */}
                    <div style={{ marginTop: '14px', padding: '12px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {showConvertedCurrency ? <FontAwesomeIcon icon={faEye} style={{ color: '#1565C0' }} /> : <FontAwesomeIcon icon={faEyeSlash} style={{ color: '#888' }} />}
                          Show {selectedCurrency} amount on PDF invoice
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          {showConvertedCurrency
                            ? `Both PKR and ${selectedCurrency} amounts will appear on the invoice`
                            : `Only PKR amount will appear on the invoice`}
                        </div>
                      </div>
                      <button type="button" onClick={() => setShowConvertedCurrency(!showConvertedCurrency)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <FontAwesomeIcon
                          icon={showConvertedCurrency ? faToggleOn : faToggleOff}
                          style={{ fontSize: '30px', color: showConvertedCurrency ? '#1565C0' : '#ccc', transition: 'color 0.2s' }}
                        />
                      </button>
                    </div>

                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#E3F2FD', borderRadius: '8px', border: '1px solid #90CAF9', fontSize: '12px', color: '#1565C0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FontAwesomeIcon icon={faInfoCircle} />
                      All amounts are stored in <strong>PKR</strong>. {selectedCurrency} shown on PDF only.
                    </div>
                  </div>
                )}

                {isPKR && (
                  <div style={{ padding: '10px 14px', background: '#E8F5E9', borderRadius: '8px', border: '1px solid #A5D6A7', fontSize: '12px', color: '#2E7D32' }}>
                    ✓ Invoice will be billed in <strong>PKR</strong> — no conversion needed.
                  </div>
                )}
              </div>

              {/* ── Student Invoice ── */}
              {isStudent && (
                <div style={sectionStyle}>
                  <div style={sectionTitle}>
                    <FontAwesomeIcon icon={faUser} style={{ color: '#F47B20' }} />
                    Student Information
                  </div>

                  <StudentSelector
                    mode={studentMode} onModeChange={(m) => { setStudentMode(m); setSelectedStudent(null); clearCountrySelection(); }}
                    students={students}
                    dbValue={selectedStudent}
                    onDbSelect={handleStudentSelect}
                    manualValue={manualStudent}
                    onManualChange={setManualStudent}
                    label="Student" required={true}
                    showModeToggle={true}
                  />

                  {(studentMode === 'db' ? selectedStudent : manualStudent.name?.trim()) && (
                    <>
                      <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, fontSize: '13px', color: '#F47B20' }}>
                          Select Countries (Multiple Selection)
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px 14px',
                          padding: '14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '10px',
                          background: '#fafafa'
                        }}>
                          {countries.length === 0 ? (
                            <p style={{ gridColumn: '1 / -1', margin: 0, textAlign: 'center', color: '#888', fontSize: '13px' }}>Loading countries...</p>
                          ) : (
                            countries.map(country => {
                              const isSelected = selectedCountryIds.includes(country.id);
                              return (
                                <label key={country.id} style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                  fontSize: '13px', color: isSelected ? '#E65100' : '#374151', fontWeight: isSelected ? 600 : 400
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleCountryToggle(country)}
                                    style={{ width: '15px', height: '15px', accentColor: '#F47B20' }}
                                  />
                                  <span>{country.country_name}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                        {getSelectedCountryNames().length > 0 && (
                          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                            Selected: <strong style={{ color: '#F47B20' }}>{getSelectedCountryNames().join(', ')}</strong>
                          </p>
                        )}
                      </div>

                      {selectedCountryIds.map(countryId => {
                        const country = countries.find(c => c.id === countryId);
                        const serviceSets = countryServicesMap[countryId] || [];
                        if (!country) return null;
                        return (
                          <div key={countryId} style={{ marginTop: '14px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>
                              {country.country_name} — Service Sets
                            </label>
                            {serviceSets.length === 0 ? (
                              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>No services configured for this country.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {serviceSets.map(set => {
                                  const setSelected = isSetSelected(set.id, countryId);
                                  const subs = set.sub_services || [];
                                  return (
                                    <div key={set.id} style={{
                                      border: `1.5px solid ${setSelected ? '#F47B20' : '#e5e7eb'}`,
                                      borderRadius: '10px',
                                      background: setSelected ? '#FFFBF5' : '#fafafa',
                                      overflow: 'hidden'
                                    }}>
                                      <label style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        padding: '12px 14px', cursor: 'pointer',
                                        background: setSelected ? '#FFF3E0' : 'transparent'
                                      }}>
                                        <input
                                          type="checkbox"
                                          checked={setSelected}
                                          onChange={() => toggleServiceSet(set, country)}
                                          style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#F47B20', flexShrink: 0 }}
                                        />
                                        <span style={{
                                          fontSize: '13px', fontWeight: 700,
                                          color: setSelected ? '#E65100' : '#333', lineHeight: 1.4
                                        }}>
                                          {set.service_name}
                                        </span>
                                      </label>

                                      {setSelected && (
                                        <ul style={{
                                          listStyle: 'none', margin: 0, padding: '4px 14px 12px 40px'
                                        }}>
                                          {subs.length === 0 ? (
                                            <li style={{ fontSize: '12px', color: '#888' }}>No sub-services in this set.</li>
                                          ) : subs.map(sub => {
                                            const checked = isSubSelected(sub.id, countryId);
                                            return (
                                              <li key={sub.id} style={{ marginBottom: '6px' }}>
                                                <label style={{
                                                  display: 'flex', alignItems: 'center', gap: '8px',
                                                  cursor: 'pointer', fontSize: '13px',
                                                  color: checked ? '#374151' : '#9ca3af'
                                                }}>
                                                  <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleSubService(sub, set, country)}
                                                    style={{ width: '14px', marginBottom: '0', height: '14px', accentColor: '#F47B20' }}
                                                  />
                                                  <span>{sub.service_name}</span>
                                                </label>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* ── University Commission — multi-student ── */}
              {isCommission && (
                <div style={sectionStyle}>
                  <div style={sectionTitle}>
                    <FontAwesomeIcon icon={faUniversity} style={{ color: '#F47B20' }} />
                    University Commission — Students
                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 400, color: '#888' }}>
                      {commissionStudents.length} student{commissionStudents.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {commissionStudents.map((entry, idx) => (
                    <CommissionStudentCard
                      key={idx}
                      entry={entry}
                      index={idx}
                      students={students}
                      onUpdate={updateCommissionStudent}
                      onRemove={removeCommissionStudent}
                    />
                  ))}

                  <button type="button" onClick={addCommissionStudent}
                    style={{ width: '100%', padding: '12px', border: '2px dashed #F47B20', borderRadius: '10px', background: '#FFFBF5', color: '#F47B20', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF3E0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFBF5'}>
                    <FontAwesomeIcon icon={faPlus} /> Add Another Student
                  </button>

                  {commissionStudents.length > 0 && (
                    <div style={{ marginTop: '16px', background: '#F3E5F5', borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#6A1B9A', marginBottom: '10px' }}>Commission Summary</div>
                      {commissionStudents.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: '#555' }}>
                          <span>{s.studentName || `Student ${idx + 1}`} {s.universityName ? `(${s.universityName})` : ''}</span>
                          <span style={{ fontWeight: 600 }}>PKR {(parseFloat(s.commissionAmount) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #CE93D8', fontWeight: 800, fontSize: '16px', color: '#6A1B9A', marginTop: '6px' }}>
                        <span>Total Commission</span>
                        <span>PKR {commissionTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {!isPKR && convertedAmount !== null && showConvertedCurrency && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '4px', borderTop: '1px dashed #CE93D8', fontSize: '13px', color: '#888' }}>
                          <span>≈ {selectedCurrency}</span>
                          <span style={{ fontWeight: 700, color: '#6A1B9A' }}>{currencyInfo.symbol} {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Agent Commission ── */}
              {isAgent && (
                <div style={sectionStyle}>
                  <div style={sectionTitle}>
                    <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20' }} />
                    Agent Commission Details
                  </div>

                  <div className="form-group">
                    <label>Select Agent <span style={{ color: 'red' }}>*</span></label>
                    <select className="input-field" value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}>
                      <option value="">Select Agent</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.agent_name}{a.company_name ? ` (${a.company_name})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Agent Students — DB or Manual ── */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#333', marginBottom: '10px' }}>
                      Link Students (Optional)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button type="button" onClick={() => setAgentStudentMode('db')}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', border: `1.5px solid ${agentStudentMode === 'db' ? '#F47B20' : '#e5e7eb'}`, background: agentStudentMode === 'db' ? '#FFF3E0' : '#fafafa', color: agentStudentMode === 'db' ? '#E65100' : '#666', fontWeight: agentStudentMode === 'db' ? 700 : 400, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <FontAwesomeIcon icon={faDatabase} /> From Database
                      </button>
                      <button type="button" onClick={() => setAgentStudentMode('manual')}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', border: `1.5px solid ${agentStudentMode === 'manual' ? '#6A1B9A' : '#e5e7eb'}`, background: agentStudentMode === 'manual' ? '#F3E5F5' : '#fafafa', color: agentStudentMode === 'manual' ? '#6A1B9A' : '#666', fontWeight: agentStudentMode === 'manual' ? 700 : 400, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <FontAwesomeIcon icon={faKeyboard} /> Manual Entry
                      </button>
                    </div>

                    {agentStudentMode === 'db' ? (
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input type="text" className="input-field"
                          placeholder="Search student by name or ID..."
                          value={agentStudentSearch}
                          onChange={e => handleAgentStudentSearch(e.target.value)}
                        />
                        {showAgentStudentDropdown && agentStudentResults.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto' }}>
                            {agentStudentResults.map(s => (
                              <div key={s.id} onClick={() => addAgentStudentFromDb(s)}
                                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: '13px' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#FFF3E0'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <strong>{[s.name, s.middle_name, s.surname].filter(Boolean).join(' ')}</strong>
                                <span style={{ color: '#888', marginLeft: '8px' }}>{s.student_id}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={addManualAgentStudent}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F3E5F5', color: '#6A1B9A', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
                        <FontAwesomeIcon icon={faPlus} /> Add Manual Student
                      </button>
                    )}

                    {/* Render selected/added students */}
                    {selectedAgentStudents.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedAgentStudents.map(s => (
                          <div key={s.id} style={{ background: s.isManual ? '#FAF5FF' : '#E3F2FD', border: `1px solid ${s.isManual ? '#E1BEE7' : '#90CAF9'}`, borderRadius: '10px', padding: '10px 14px' }}>
                            {s.isManual ? (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6A1B9A', background: '#E1BEE7', padding: '2px 8px', borderRadius: '8px' }}>Manual</span>
                                  <button onClick={() => removeAgentStudent(s.id)} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}>
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <input className="input-field" style={{ margin: 0 }} placeholder="Full Name *" value={s.student_name}
                                    onChange={e => updateManualAgentStudent(s.id, 'student_name', e.target.value)} />
                                  <input className="input-field" style={{ margin: 0 }} placeholder="Email" value={s.student_email}
                                    onChange={e => updateManualAgentStudent(s.id, 'student_email', e.target.value)} />
                                  <input className="input-field" style={{ margin: 0 }} placeholder="Mobile" value={s.student_mobile}
                                    onChange={e => updateManualAgentStudent(s.id, 'student_mobile', e.target.value)} />
                                  <input className="input-field" style={{ margin: 0 }} placeholder="Country" value={s.student_country}
                                    onChange={e => updateManualAgentStudent(s.id, 'student_country', e.target.value)} />
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faUser} style={{ color: '#1565C0', fontSize: '12px' }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1565C0' }}>{s.student_name}</div>
                                  <div style={{ fontSize: '11px', color: '#888' }}>{s.student_ref_id}</div>
                                </div>
                                <button onClick={() => removeAgentStudent(s.id)} style={{ background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}>
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Pricing ── */}
              <div style={sectionStyle}>
                <div style={sectionTitle}>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#F47B20' }} />
                  {isAgent ? 'Commission Calculation' : isCommission ? 'Additional Pricing' : 'Pricing Details'}
                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#888', marginLeft: 'auto' }}>All amounts in PKR</span>
                </div>

                {/* University Commission — totals are auto-calculated from students; show read-only summary */}
                {isCommission ? (
                  <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '10px', fontSize: '13px', color: '#666', textAlign: 'center' }}>
                    <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '6px', color: '#F47B20' }} />
                    Total commission is automatically calculated from the student entries above.
                    <div style={{ marginTop: '10px', fontWeight: 700, fontSize: '18px', color: '#6A1B9A' }}>
                      Total: PKR {commissionTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>
                          {isAgent ? 'Total Amount (PKR)' : 'Base Amount (PKR)'}
                          {isAgent && <span style={{ color: 'red' }}> *</span>}
                          {!isAgent && <span style={{ fontSize: '11px', color: '#888', fontWeight: 400, marginLeft: '6px' }}>(optional)</span>}
                        </label>
                        <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01"
                          value={baseAmount} onChange={e => setBaseAmount(e.target.value)} />
                      </div>
                    </div>

                    {isAgent ? (
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Agent Commission % <span style={{ color: 'red' }}>*</span></label>
                          <div style={{ position: 'relative' }}>
                            <input type="number" className="input-field" placeholder="e.g. 15" min="0" max="100" step="0.01"
                              value={agentCommissionPercent} onChange={e => setAgentCommissionPercent(e.target.value)} style={{ paddingRight: '36px' }} />
                            <FontAwesomeIcon icon={faPercent} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '12px' }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>Discount (PKR)</label>
                            <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01"
                              value={discount} onChange={e => setDiscount(e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>GST %</label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" className="input-field" placeholder="10" min="0" max="100" step="0.1"
                                value={gstPercent} onChange={e => setGstPercent(e.target.value)} style={{ paddingRight: '36px' }} />
                              <FontAwesomeIcon icon={faPercent} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '12px' }} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isAgent && base > 0 && (
                  <div style={{ background: '#F3E5F5', borderRadius: '10px', padding: '16px', marginBottom: '16px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#666' }}>Total Amount</span>
                      <span>PKR {base.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#666' }}>Commission Rate</span>
                      <span>{agentCommissionPercent || 0}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #CE93D8', fontWeight: 700, fontSize: '16px' }}>
                      <span>Final Commission (PKR)</span>
                      <span style={{ color: '#6A1B9A' }}>PKR {agentCommissionAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {!isPKR && convertedAmount !== null && showConvertedCurrency && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px dashed #CE93D8', fontSize: '13px', color: '#888' }}>
                        <span>Equivalent in {selectedCurrency}</span>
                        <span style={{ fontWeight: 700, color: '#6A1B9A' }}>{currencyInfo.symbol} {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                )}

                {!isAgent && !isCommission && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px' }}>Additional Services</label>
                        <button type="button" onClick={addExtraService}
                          style={{ background: '#F47B20', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FontAwesomeIcon icon={faPlus} /> Add Service
                        </button>
                      </div>
                      {extraServices.map((svc, idx) => (
                        <div key={svc.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                          <input type="text" className="input-field" placeholder={`Service ${idx + 1} name`}
                            value={svc.name} onChange={e => updateExtraService(svc.id, 'name', e.target.value)} style={{ flex: 2 }} />
                          <input type="number" className="input-field" placeholder="Price (PKR)"
                            value={svc.price} onChange={e => updateExtraService(svc.id, 'price', e.target.value)} style={{ flex: 1 }} min="0" step="0.01" />
                          <button type="button" onClick={() => removeExtraService(svc.id)}
                            style={{ background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '16px' }}>
                      {base > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#666' }}>Base Amount</span>
                          <span>PKR {base.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {extraServicesTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#666' }}>Additional Services</span>
                          <span style={{ color: '#1976D2' }}>+ PKR {extraServicesTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {gstAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#666' }}>GST ({gstPercent}%)</span>
                          <span style={{ color: '#FF9800' }}>+ PKR {gstAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {disc > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ color: '#666' }}>Discount</span>
                          <span style={{ color: '#4CAF50' }}>- PKR {disc.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #e5e7eb', fontWeight: 700, fontSize: '16px' }}>
                        <span>Final Amount (PKR)</span>
                        <span style={{ color: '#F47B20' }}>PKR {finalAmountPKR.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {!isPKR && convertedAmount !== null && showConvertedCurrency && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px dashed #e0c090', fontSize: '13px' }}>
                          <span style={{ color: '#888' }}>Equivalent in {selectedCurrency}</span>
                          <span style={{ fontWeight: 700, color: '#F47B20' }}>{currencyInfo.symbol} {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ── Notes ── */}
              <div style={sectionStyle}>
                <div className="form-group">
                  <label>Notes / Remarks</label>
                  <textarea className="input-field" rows="3" placeholder="Additional notes for this invoice..."
                    value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* ── Sidebar Summary ── */}
            <div className="col-md-4">
              <div style={{ ...sectionStyle, position: 'sticky', top: '20px' }}>
                <div style={sectionTitle}>Invoice Summary</div>
                <div style={{ fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#666' }}>Type</span>
                    <span style={{ fontWeight: 600 }}>{invoiceType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#666' }}>Date</span>
                    <span style={{ fontWeight: 600 }}>{invoiceDate || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#666' }}>Payment</span>
                    <span style={{ fontWeight: 700, color: paymentMethod === 'cash' ? '#2E7D32' : '#333', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FontAwesomeIcon icon={paymentMethod === 'cash' ? faMoneyBill : faCreditCard} style={{ fontSize: '11px' }} />
                      {paymentMethod === 'cash' ? 'Cash' : (bankAccounts.find(b => b.id === parseInt(bankAccountId))?.account_name || 'Bank —')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#666' }}>Currency</span>
                    <span style={{ fontWeight: 700, color: !isPKR ? '#F47B20' : '#333' }}>
                      {currencyInfo.flag} {selectedCurrency}
                    </span>
                  </div>
                  {!isPKR && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#666' }}>Show on PDF</span>
                      <span style={{ fontWeight: 700, color: showConvertedCurrency ? '#1565C0' : '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FontAwesomeIcon icon={showConvertedCurrency ? faEye : faEyeSlash} />
                        {showConvertedCurrency ? 'Both currencies' : 'PKR only'}
                      </span>
                    </div>
                  )}

                  {isStudent && (
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Student</span>
                      {studentMode === 'db' && selectedStudent ? (
                        <>
                          <span style={{ fontWeight: 600 }}>{[selectedStudent.name, selectedStudent.middle_name, selectedStudent.surname].filter(Boolean).join(' ')}</span>
                          <span style={{ color: '#888', display: 'block', fontSize: '11px' }}>{selectedStudent.student_id}</span>
                        </>
                      ) : studentMode === 'manual' && manualStudent.name ? (
                        <>
                          <span style={{ fontWeight: 600 }}>{manualStudent.name}</span>
                          <span style={{ background: '#F3E5F5', color: '#6A1B9A', fontSize: '10px', padding: '1px 7px', borderRadius: '8px', marginLeft: '6px', fontWeight: 600 }}>Manual</span>
                        </>
                      ) : (
                        <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '12px' }}>Not selected</span>
                      )}
                    </div>
                  )}

                  {isCommission && (
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#666', display: 'block', marginBottom: '6px' }}>Students ({commissionStudents.length})</span>
                      {commissionStudents.map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#333' }}>{s.studentName || `Student ${i + 1}`}</span>
                          <span style={{ fontWeight: 700, color: '#6A1B9A' }}>PKR {(parseFloat(s.commissionAmount) || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAgent && selectedAgentId && (
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#666', display: 'block', marginBottom: '4px' }}>Agent</span>
                      <span style={{ fontWeight: 600 }}>{agents.find(a => a.id === parseInt(selectedAgentId))?.agent_name || '-'}</span>
                      {selectedAgentStudents.length > 0 && (
                        <span style={{ color: '#888', display: 'block', fontSize: '11px' }}>{selectedAgentStudents.length} student(s) linked</span>
                      )}
                    </div>
                  )}

                  {isStudent && selectedCountryServices.some(s => s.is_parent) && (
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#666', display: 'block', marginBottom: '6px' }}>Country Service Sets</span>
                      {selectedCountryServices.filter(s => s.is_parent).map(parent => {
                        const subs = selectedCountryServices.filter(
                          s => !s.is_parent && s.parent_service_id === parent.id && s.country_id === parent.country_id
                        );
                        return (
                          <div key={`${parent.country_id}-${parent.id}`} style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#E65100' }}>
                              {parent.country_name}: {parent.service_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                              {subs.length} sub-service{subs.length !== 1 ? 's' : ''} included
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Final amount display */}
                  {isAgent ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#666' }}>Total Amount</span>
                        <span>PKR {base.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#666' }}>Commission %</span>
                        <span>{agentCommissionPercent || 0}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #9C27B0', fontWeight: 700, fontSize: '16px', color: '#6A1B9A' }}>
                        <span>Commission (PKR)</span>
                        <span>PKR {agentCommissionAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {!isPKR && convertedAmount !== null && showConvertedCurrency && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px', color: '#888' }}>
                          <span>≈ {selectedCurrency}</span>
                          <span style={{ fontWeight: 700, color: '#6A1B9A' }}>{currencyInfo.symbol} {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </>
                  ) : isCommission ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #6A1B9A', fontWeight: 700, fontSize: '16px', color: '#6A1B9A' }}>
                      <span>Total (PKR)</span>
                      <span>PKR {commissionTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : (
                    <>
                      {base > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#666' }}>Base Amount</span>
                          <span>PKR {base.toLocaleString()}</span>
                        </div>
                      )}
                      {extraServicesTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#666' }}>Extra Services</span>
                          <span style={{ color: '#1976D2' }}>+PKR {extraServicesTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {gstAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#666' }}>GST ({gstPercent}%)</span>
                          <span style={{ color: '#FF9800' }}>+PKR {gstAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {disc > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#666' }}>Discount</span>
                          <span style={{ color: '#4CAF50' }}>-PKR {disc.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #F47B20', fontWeight: 700, fontSize: '16px', color: '#F47B20' }}>
                        <span>Final (PKR)</span>
                        <span>PKR {finalAmountPKR.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {!isPKR && convertedAmount !== null && showConvertedCurrency && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px', color: '#888' }}>
                          <span>≈ {selectedCurrency}</span>
                          <span style={{ fontWeight: 700, color: '#F47B20' }}>{currencyInfo.symbol} {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Creating Invoice...' : 'Create Invoice'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => canPreviewInvoice && setShowPreview(true)}
                    disabled={!canPreviewInvoice}
                    title={canPreviewInvoice ? 'Preview invoice' : 'Fill all required fields to preview'}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: canPreviewInvoice ? 1 : 0.5,
                      cursor: canPreviewInvoice ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} /> Preview Invoice
                  </button>
                  <button className="btn-secondary" onClick={() => navigate('/finance/invoices')} style={{ width: '100%', justifyContent: 'center' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '860px',
              maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #eee', flexShrink: 0
            }}>
              <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#F47B20' }} />
                Invoice Preview
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn-icon"
                title="Close"
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: '#666' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, background: '#f5f5f5' }}>
              <InvoiceDocument data={buildPreviewData()} preview />
            </div>
          </div>
        </div>
      )}
    </>
  );
}