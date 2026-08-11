import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/leads.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
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
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Leads() {
    const [leads, setLeads] = useState([]);
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
        course: [],
        qualification: [],
        date: []
    });
    const [filterSearch, setFilterSearch] = useState({
        fullName: '',
        phone: '',
        email: '',
        countries: '',
        course: '',
        qualification: '',
        date: ''
    });
    // NEW: tracks which stat card is active ('new' | 'assigned' | null)
    const [statFilter, setStatFilter] = useState(null);
    const [recordView, setRecordView] = useState('active');
    const [registeredCount, setRegisteredCount] = useState(0);

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

    // ── Unique values per column ───────────────────────────────────────────────
    const getUniqueValues = (column) => {
        const values = new Set();
        leads.forEach(lead => {
            if (column === 'countries') {
                // Each country is a SEPARATE option
                const arr = parseCountriesArray(lead.countries_of_interest);
                arr.forEach(c => values.add(c));
            } else {
                let value;
                switch (column) {
                    case 'fullName':      value = lead.full_name; break;
                    case 'phone':         value = lead.phone || null; break;
                    case 'email':         value = lead.email || null; break;
                    case 'course':        value = lead.course || null; break;
                    case 'qualification': value = lead.qualification || null; break;
                    case 'date':
                        value = recordView === 'registered' && lead.registered_at
                            ? new Date(lead.registered_at).toLocaleDateString()
                            : new Date(lead.created_at).toLocaleDateString();
                        break;
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
        setColumnFilters({ fullName: [], phone: [], email: [], countries: [], course: [], qualification: [], date: [] });
        setFilterSearch({ fullName: '', phone: '', email: '', countries: '', course: '', qualification: '', date: '' });
        setSearchTerm('');
        setStatFilter(null);
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

        if (columnFilters.course.length > 0 && !columnFilters.course.includes(lead.course)) return false;
        if (columnFilters.qualification.length > 0 && !columnFilters.qualification.includes(lead.qualification)) return false;
        if (columnFilters.date.length > 0) {
            const dateStr = recordView === 'registered' && lead.registered_at
                ? new Date(lead.registered_at).toLocaleDateString()
                : new Date(lead.created_at).toLocaleDateString();
            if (!columnFilters.date.includes(dateStr)) return false;
        }

        return true;
    });

    const newLeadsCount = recordView === 'active'
        ? leads.filter(isNewLead).length
        : 0;
    const assignedLeadsCount = recordView === 'active'
        ? leads.filter(isAssignedLead).length
        : 0;

    const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim() || (recordView === 'active' && statFilter);

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

                    {/* Search Bar */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px', borderRadius: '10px', border: '1px solid #e5e7eb', height: '42px' }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
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
                                            <th><FilterDropdown column="course" label="Course" /></th>
                                            <th><FilterDropdown column="qualification" label="Qualification" /></th>
                                            <th><FilterDropdown column="date" label={recordView === 'registered' ? 'Registered On' : 'Walk-in Date'} /></th>
                                            {recordView === 'registered' && <th>Follow-ups</th>}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.length > 0 ? (
                                            filteredLeads.map((lead) => (
                                                <tr key={lead.id}>
                                                    <td><strong>{lead.full_name}</strong></td>
                                                    <td>{lead.phone || '-'}</td>
                                                    <td>{lead.email}</td>
                                                    <td>
                                                        <span style={{ fontSize: '13px', color: '#374151' }}>
                                                            {parseCountriesDisplay(lead.countries_of_interest)}
                                                        </span>
                                                    </td>
                                                    <td>{lead.course || '-'}</td>
                                                    <td>{lead.qualification || '-'}</td>
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

                            <div className="pagination">
                                <button className="btn-secondary">Previous</button>
                                <div className="page-numbers">
                                    <button className="page-number active">1</button>
                                    <button className="page-number">2</button>
                                    <button className="page-number">3</button>
                                </div>
                                <button className="btn-secondary">Next</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}