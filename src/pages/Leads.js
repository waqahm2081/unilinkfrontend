import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/leads.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PrintReportButton from '../components/PrintReportButton'
import DateRangeFilter from '../components/DateRangeFilter'
import ViewRecordModal from '../components/ViewRecordModal'
import EditLead from './EditLead'
import ListPagination from '../components/ListPagination'
import useListPagination from '../hooks/useListPagination'
import { EMPTY_DATE_RANGE, hasDateRange, isDateInRange } from '../utils/dateRange'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faEdit,
  faTrash,
  faDownload,
  faPhone,
  faCheckCircle,
  faChevronDown,
  faTimes,
  faSearch,
  faUserTie,
  faExternalLinkAlt,
  faUserGraduate,
  faHistory,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [viewRecordId, setViewRecordId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [columnFilters, setColumnFilters] = useState({
        fullName: [],
        phone: [],
        email: [],
        countries: [],
        institute: [],
        qualification: []
    });
    const [filterSearch, setFilterSearch] = useState({
        fullName: '',
        phone: '',
        email: '',
        countries: '',
        institute: '',
        qualification: ''
    });
    // NEW: tracks which stat card is active ('new' | 'assigned' | null)
    const [statFilter, setStatFilter] = useState(null);
    const [recordView, setRecordView] = useState('active');
    const [registeredCount, setRegisteredCount] = useState(0);
    const [dateRange, setDateRange] = useState(EMPTY_DATE_RANGE);

    useEffect(() => {
        fetchLeads();
    }, [recordView]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.filter-dropdown-container')) {
                setActiveFilter(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/leads?view=${recordView}`);
            const data = await response.json();
            if (data.success) {
                setLeads(data.leads);
                if (typeof data.registeredCount === 'number') {
                    setRegisteredCount(data.registeredCount);
                }
            } else {
                setError(data.message || 'Failed to fetch leads');
            }
        } catch (err) {
            console.error('Error fetching leads:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const formatLeadId = (id) => `LEAD${String(id).padStart(5, '0')}`;

    // Parse countries_of_interest into an array
    const parseCountriesArray = (countriesOfInterest) => {
        if (!countriesOfInterest) return [];
        try {
            const parsed = typeof countriesOfInterest === 'string'
                ? JSON.parse(countriesOfInterest)
                : countriesOfInterest;
            if (Array.isArray(parsed)) return parsed.map(c => c.trim()).filter(Boolean);
            return [String(countriesOfInterest).trim()];
        } catch {
            // Handle comma-separated plain strings as fallback
            return String(countriesOfInterest).split(',').map(c => c.trim()).filter(Boolean);
        }
    };

    // Display parsed countries as comma-separated string for the table cell
    const parseCountriesDisplay = (countriesOfInterest) => {
        const arr = parseCountriesArray(countriesOfInterest);
        return arr.length > 0 ? arr.join(', ') : '-';
    };

    const parseQualificationLevels = (lead) => {
        if (lead.qualifications) {
            try {
                const parsed = typeof lead.qualifications === 'string'
                    ? JSON.parse(lead.qualifications)
                    : lead.qualifications;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed
                        .map(q => q.level || q.qualification)
                        .filter(Boolean);
                }
            } catch { /* fall through */ }
        }
        return lead.qualification ? [lead.qualification] : [];
    };

    const parseQualificationsDisplay = (lead) => {
        const levels = parseQualificationLevels(lead);
        return levels.length > 0 ? levels.join(', ') : '-';
    };

    // ── Unique values per column ───────────────────────────────────────────────
    const getUniqueValues = (column) => {
        const values = new Set();
        leads.forEach(lead => {
            if (column === 'countries') {
                // Each country is a SEPARATE option
                const arr = parseCountriesArray(lead.countries_of_interest);
                arr.forEach(c => values.add(c));
            } else if (column === 'qualification') {
                parseQualificationLevels(lead).forEach(q => values.add(q));
            } else {
                let value;
                switch (column) {
                    case 'fullName':      value = lead.full_name; break;
                    case 'phone':         value = lead.phone || null; break;
                    case 'email':         value = lead.email || null; break;
                    case 'institute':     value = lead.institute_name || null; break;
                    default: value = '';
                }
                if (value) values.add(value);
            }
        });
        return Array.from(values).sort();
    };

    const getFilteredOptions = (column) => {
        const uniqueValues = getUniqueValues(column);
        const term = filterSearch[column].toLowerCase();
        return term ? uniqueValues.filter(v => v.toLowerCase().includes(term)) : uniqueValues;
    };

    const toggleFilterValue = (column, value) => {
        setColumnFilters(prev => {
            const current = prev[column];
            return {
                ...prev,
                [column]: current.includes(value)
                    ? current.filter(v => v !== value)
                    : [...current, value]
            };
        });
    };

    const clearColumnFilter = (column) => {
        setColumnFilters(prev => ({ ...prev, [column]: [] }));
        setFilterSearch(prev => ({ ...prev, [column]: '' }));
    };

    const clearAllFilters = () => {
        setColumnFilters({ fullName: [], phone: [], email: [], countries: [], institute: [], qualification: [] });
        setFilterSearch({ fullName: '', phone: '', email: '', countries: '', institute: '', qualification: '' });
        setSearchTerm('');
        setStatFilter(null);
        setDateRange(EMPTY_DATE_RANGE);
    };

    const handleViewChange = (view) => {
        setRecordView(view);
        setStatFilter(null);
        clearAllFilters();
    };

    // NEW: handles clicking a stat card
    const handleStatClick = (key) => {
        setStatFilter(prev => (prev === key ? null : key));
    };

    // NEW: helper mirrors the same logic used to compute the stat counts below
    const isNewLead = (l) => (!l.counselor_count || l.counselor_count === 0) && !l.is_registered;
    const isAssignedLead = (l) => l.counselor_count && l.counselor_count > 0 && !l.is_registered;

    // ── Apply filters ──────────────────────────────────────────────────────────
    const filteredLeads = leads.filter(lead => {
        if (recordView === 'active') {
            if (statFilter === 'new' && !isNewLead(lead)) return false;
            if (statFilter === 'assigned' && !isAssignedLead(lead)) return false;
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesName  = lead.full_name?.toLowerCase().includes(term);
            const matchesId    = formatLeadId(lead.id).toLowerCase().includes(term);
            const matchesEmail = lead.email?.toLowerCase().includes(term);
            if (!matchesName && !matchesId && !matchesEmail) return false;
        }

        if (columnFilters.fullName.length > 0 && !columnFilters.fullName.includes(lead.full_name)) return false;
        if (columnFilters.phone.length > 0 && !columnFilters.phone.includes(lead.phone)) return false;
        if (columnFilters.email.length > 0 && !columnFilters.email.includes(lead.email)) return false;

        // Countries: lead must have AT LEAST ONE of the selected countries
        if (columnFilters.countries.length > 0) {
            const leadCountries = parseCountriesArray(lead.countries_of_interest);
            const hasMatch = columnFilters.countries.some(c => leadCountries.includes(c));
            if (!hasMatch) return false;
        }

        if (columnFilters.institute.length > 0 && !columnFilters.institute.includes(lead.institute_name)) return false;
        if (columnFilters.qualification.length > 0) {
            const leadLevels = parseQualificationLevels(lead);
            const hasMatch = columnFilters.qualification.some(q => leadLevels.includes(q));
            if (!hasMatch) return false;
        }

        if (hasDateRange(dateRange)) {
            const leadDate = recordView === 'registered' && lead.registered_at
                ? lead.registered_at
                : lead.created_at;
            if (!isDateInRange(leadDate, dateRange.from, dateRange.to)) return false;
        }

        return true;
    });

    const { paginatedItems: paginatedLeads, totalPages, currentPage, goToPage } = useListPagination(
        filteredLeads,
        [searchTerm, JSON.stringify(columnFilters), dateRange.from, dateRange.to, recordView, statFilter].join('|')
    );

    const newLeadsCount = recordView === 'active'
        ? leads.filter(isNewLead).length
        : 0;
    const assignedLeadsCount = recordView === 'active'
        ? leads.filter(isAssignedLead).length
        : 0;

    const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim() || (recordView === 'active' && statFilter) || hasDateRange(dateRange);

    // ── FilterDropdown component ───────────────────────────────────────────────
    const FilterDropdown = ({ column, label }) => {
        const triggerRef = React.useRef(null);
        const isActive = activeFilter === column;
        const hasFilters = columnFilters[column].length > 0;
        const filteredOptions = getFilteredOptions(column);
        const allOptions = getUniqueValues(column);

        const handleToggle = () => {
            if (isActive) {
                setActiveFilter(null);
            } else {
                const rect = triggerRef.current.getBoundingClientRect();
                const dropdownHeight = 400;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                let top = spaceBelow >= dropdownHeight || spaceBelow > spaceAbove
                    ? rect.bottom + 8
                    : rect.top - dropdownHeight - 8;
                let left = rect.left;
                const dropdownWidth = 320;
                if (left + dropdownWidth > window.innerWidth) {
                    left = window.innerWidth - dropdownWidth - 20;
                }
                setDropdownPosition({ top, left });
                setActiveFilter(column);
            }
        };

        return (
            <div className="filter-dropdown-container">
                <button
                    ref={triggerRef}
                    className={`filter-trigger ${hasFilters ? 'has-filters' : ''}`}
                    onClick={handleToggle}
                >
                    {label}
                    <FontAwesomeIcon icon={faChevronDown} className="filter-icon" />
                    {hasFilters && <span className="filter-count">{columnFilters[column].length}</span>}
                </button>
                {isActive && (
                    <div className="filter-dropdown" style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
                        <div className="filter-dropdown-header">
                            <input
                                type="text"
                                className="filter-search-input"
                                placeholder="Search..."
                                value={filterSearch[column]}
                                onChange={(e) => setFilterSearch(prev => ({ ...prev, [column]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="filter-options">
                            <label className="filter-option select-all">
                                <input
                                    type="checkbox"
                                    checked={columnFilters[column].length === allOptions.length && allOptions.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setColumnFilters(prev => ({ ...prev, [column]: allOptions }));
                                        } else {
                                            clearColumnFilter(column);
                                        }
                                    }}
                                />
                                <span className="filter-label">Select All</span>
                            </label>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((value, index) => (
                                    <label key={index} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={columnFilters[column].includes(value)}
                                            onChange={() => toggleFilterValue(column, value)}
                                        />
                                        <span className="filter-label">{value}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="no-results">No results found</div>
                            )}
                        </div>
                        <div className="filter-dropdown-footer">
                            <button className="btn-clear-filter" onClick={() => clearColumnFilter(column)}>Clear</button>
                            <button className="btn-apply-filter" onClick={() => setActiveFilter(null)}>Apply</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatPrintDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : '-');

    const printColumns = [
        { header: 'Full Name', value: (r) => r.full_name },
        { header: 'Contact Number', value: (r) => r.phone || '-' },
        { header: 'Email', value: (r) => r.email },
        { header: 'Countries', value: (r) => parseCountriesDisplay(r.countries_of_interest) },
        { header: 'School/College/Institute', value: (r) => r.institute_name || '-' },
        { header: 'Qualification', value: (r) => parseQualificationsDisplay(r) },
        {
            header: recordView === 'registered' ? 'Registered On' : 'Walk-in Date',
            value: (r) => recordView === 'registered' && r.registered_at
                ? formatPrintDate(r.registered_at)
                : formatPrintDate(r.created_at),
        },
    ];
    if (recordView === 'registered') {
        printColumns.push({ header: 'Follow-ups', value: (r) => r.follow_up_count || 0 });
    }

    return (
        <>
            <Sidebar />
            <div className="main-content" id="mainContent">
                <Header />
                <div className="leads-container">
                    <div className="leads-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faUserPlus} className="page-icon" />
                                Leads Management
                            </h1>
                        </div>
                        <div className="header-right">
                            <PrintReportButton
                                show={hasActiveFilters}
                                title={`Leads Management${recordView === 'registered' ? ' — Registered Students' : ''}`}
                                columns={printColumns}
                                rows={filteredLeads}
                            />
                            {hasActiveFilters && (
                                <button className="btn-clear-all-filters" onClick={clearAllFilters}>
                                    <FontAwesomeIcon icon={faTimes} />
                                    Clear All Filters
                                </button>
                            )}
                            <button className="btn-secondary">
                                <FontAwesomeIcon icon={faDownload} />
                                Export
                            </button>
                            <a
                                href="/lead-form"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                            >
                                <FontAwesomeIcon icon={faUserPlus} />
                                Add Lead
                                <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '11px' }} />
                            </a>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className={recordView === 'active' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => handleViewChange('active')}
                        >
                            Active Pipeline
                        </button>
                        <button
                            type="button"
                            className={recordView === 'registered' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => handleViewChange('registered')}
                        >
                            <FontAwesomeIcon icon={faUserGraduate} style={{ marginRight: '8px' }} />
                            Registered Students
                            {registeredCount > 0 && (
                                <span style={{
                                    marginLeft: '8px', background: recordView === 'registered' ? 'rgba(255,255,255,0.25)' : '#dcfce7',
                                    color: recordView === 'registered' ? 'white' : '#166534',
                                    padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: '700'
                                }}>
                                    {registeredCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {recordView === 'registered' && (
                        <div style={{
                            background: '#eff6ff', color: '#1e40af', padding: '14px 18px',
                            borderRadius: '12px', marginBottom: '20px', border: '1px solid #bfdbfe', fontSize: '14px'
                        }}>
                            These are leads that have been converted to students. They are shown here for history only and are excluded from pipeline stats.
                        </div>
                    )}

                    {/* Statistics Cards */}
                    {recordView === 'active' && (
                    <div className="stats-grid">
                        <div
                            className="stat-card"
                            onClick={() => handleStatClick('new')}
                            style={{
                                cursor: 'pointer',
                                border: statFilter === 'new' ? '2px solid #D32F2F' : '2px solid transparent'
                            }}
                        >
                            <div className="stat-icon" style={{ backgroundColor: '#FFEBEE' }}>
                                <FontAwesomeIcon icon={faPhone} style={{ color: '#D32F2F' }} />
                            </div>
                            <div className="stat-content">
                                <h3>New Leads</h3>
                                <p className="stat-number">{newLeadsCount}</p>
                            </div>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => handleStatClick('assigned')}
                            style={{
                                cursor: 'pointer',
                                border: statFilter === 'assigned' ? '2px solid #F47B20' : '2px solid transparent'
                            }}
                        >
                            <div className="stat-icon" style={{ backgroundColor: '#FFF3E0' }}>
                                <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20' }} />
                            </div>
                            <div className="stat-content">
                                <h3>Leads Assigned</h3>
                                <p className="stat-number">{assignedLeadsCount}</p>
                            </div>
                        </div>
                    </div>
                    )}

                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    <div className="page-toolbar">
                        <div className="page-search">
                            <FontAwesomeIcon icon={faSearch} className="page-search-icon" />
                            <input
                                type="text"
                                className="page-search-input"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    className="page-search-clear"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}
                        </div>
                        <DateRangeFilter
                            label={recordView === 'registered' ? 'Registered On' : 'Walk-in Date'}
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Loading leads...</p>
                        </div>
                    ) : (
                        <>
                            <div className="leads-table-container">
                                <table className="leads-table">
                                    <thead>
                                        <tr>
                                            <th><FilterDropdown column="fullName" label="Full Name" /></th>
                                            <th><FilterDropdown column="phone" label="Contact Number" /></th>
                                            <th><FilterDropdown column="email" label="Email" /></th>
                                            <th><FilterDropdown column="countries" label="Countries" /></th>
                                            <th><FilterDropdown column="institute" label="School/College/Institute" /></th>
                                            <th><FilterDropdown column="qualification" label="Qualification" /></th>
                                            <th>{recordView === 'registered' ? 'Registered On' : 'Walk-in Date'}</th>
                                            {recordView === 'registered' && <th>Follow-ups</th>}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.length > 0 ? (
                                            paginatedLeads.map((lead) => (
                                                <tr key={lead.id}>
                                                    <td>
                                                        <Link to={`/edit-lead/${lead.id}`} className="table-name-link">
                                                            {lead.full_name}
                                                        </Link>
                                                    </td>
                                                    <td>{lead.phone || '-'}</td>
                                                    <td>{lead.email}</td>
                                                    <td>
                                                        <span style={{ fontSize: '13px', color: '#374151' }}>
                                                            {parseCountriesDisplay(lead.countries_of_interest)}
                                                        </span>
                                                    </td>
                                                    <td>{lead.institute_name || '-'}</td>
                                                    <td>{parseQualificationsDisplay(lead)}</td>
                                                    <td>
                                                        {recordView === 'registered' && lead.registered_at
                                                            ? new Date(lead.registered_at).toLocaleDateString()
                                                            : new Date(lead.created_at).toLocaleDateString()}
                                                    </td>
                                                    {recordView === 'registered' && (
                                                        <td>{lead.follow_up_count || 0}</td>
                                                    )}
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="btn-icon btn-view"
                                                                title="View Lead"
                                                                onClick={() => setViewRecordId(lead.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            {recordView === 'registered' && lead.student_user_id ? (
                                                                <Link to={`/edit-student/${lead.student_user_id}`} className="btn-icon btn-edit" title="View Student">
                                                                    <FontAwesomeIcon icon={faUserGraduate} />
                                                                </Link>
                                                            ) : null}
                                                            <Link to={`/edit-lead/${lead.id}`} className="btn-icon btn-edit" title={recordView === 'registered' ? 'View Lead History' : 'Edit Lead'}>
                                                                <FontAwesomeIcon icon={recordView === 'registered' ? faHistory : faEdit} />
                                                            </Link>
                                                            <button className="btn-icon btn-delete" title="Delete Lead">
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={recordView === 'registered' ? 9 : 8} style={{ textAlign: 'center', padding: '40px' }}>
                                                    {hasActiveFilters ? 'No leads match the selected filters' : recordView === 'registered' ? 'No registered student records found' : 'No leads found'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <ListPagination
                                total={filteredLeads.length}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                itemLabel="lead"
                            />
                        </>
                    )}
                </div>
            </div>
            {viewRecordId && (
                <ViewRecordModal title="View Lead" onClose={() => setViewRecordId(null)}>
                    <EditLead recordId={viewRecordId} viewOnly />
                </ViewRecordModal>
            )}
        </>
    );
}