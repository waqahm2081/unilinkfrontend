import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/leads.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faDownload,
  faCheckCircle,
  faHistory,
  faChevronDown,
  faTimes,
  faSearch,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Followups() {
    const [followups, setFollowups] = useState([]);
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
        lastFollowUp: []
    });
    const [filterSearch, setFilterSearch] = useState({
        fullName: '',
        phone: '',
        email: '',
        countries: '',
        course: '',
        qualification: '',
        lastFollowUp: ''
    });
    // NEW: tracks which stat card is active ('recent' | 'total' | null)
    const [statFilter, setStatFilter] = useState(null);
    const [recordView, setRecordView] = useState('active');
    const [registeredCount, setRegisteredCount] = useState(0);

    useEffect(() => {
        fetchFollowups();
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

    const fetchFollowups = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/leads/followups?view=${recordView}`);
            const data = await response.json();
            if (data.success) {
                setFollowups(data.followups);
                if (typeof data.registeredCount === 'number') {
                    setRegisteredCount(data.registeredCount);
                }
            } else {
                setError(data.message || 'Failed to fetch follow-ups');
            }
        } catch (err) {
            console.error('Error fetching follow-ups:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const formatLeadId = (id) => `LEAD${String(id).padStart(5, '0')}`;

    // Parse countries into an array — each country is a separate item
    const parseCountriesArray = (countriesOfInterest) => {
        if (!countriesOfInterest) return [];
        try {
            const parsed = typeof countriesOfInterest === 'string'
                ? JSON.parse(countriesOfInterest)
                : countriesOfInterest;
            if (Array.isArray(parsed)) return parsed.map(c => c.trim()).filter(Boolean);
            return [String(countriesOfInterest).trim()];
        } catch {
            return String(countriesOfInterest).split(',').map(c => c.trim()).filter(Boolean);
        }
    };

    const parseCountriesDisplay = (countriesOfInterest) => {
        const arr = parseCountriesArray(countriesOfInterest);
        return arr.length > 0 ? arr.join(', ') : '-';
    };

    const formatLastFollowUp = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    // NEW: helper mirrors the same logic used to compute the "recent" stat count
    const isRecentFollowup = (f) => {
        const fDate = new Date(f.last_follow_up);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return fDate >= sevenDaysAgo;
    };

    // Stats
    const recentFollowupsCount = recordView === 'active'
        ? followups.filter(isRecentFollowup).length
        : 0;

    const totalFollowupsCount = recordView === 'active'
        ? followups.reduce((total, f) => total + f.follow_up_count, 0)
        : 0;

    // NEW: handles clicking a stat card
    const handleStatClick = (key) => {
        setStatFilter(prev => (prev === key ? null : key));
    };

    // ── Unique values per column ───────────────────────────────────────────────
    const getUniqueValues = (column) => {
        const values = new Set();
        followups.forEach(f => {
            if (column === 'countries') {
                // Each country becomes its own separate option
                parseCountriesArray(f.countries_of_interest).forEach(c => values.add(c));
            } else {
                let value;
                switch (column) {
                    case 'fullName':      value = f.full_name; break;
                    case 'phone':         value = f.phone || null; break;
                    case 'email':         value = f.email || null; break;
                    case 'course':        value = f.course || null; break;
                    case 'qualification': value = f.qualification || null; break;
                    case 'lastFollowUp':  value = formatLastFollowUp(f.last_follow_up); break;
                    default: value = '';
                }
                if (value && value !== 'N/A') values.add(value);
            }
        });
        return Array.from(values).sort();
    };

    const getFilteredOptions = (column) => {
        const unique = getUniqueValues(column);
        const term = filterSearch[column].toLowerCase();
        return term ? unique.filter(v => v.toLowerCase().includes(term)) : unique;
    };

    const toggleFilterValue = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: prev[column].includes(value)
                ? prev[column].filter(v => v !== value)
                : [...prev[column], value]
        }));
    };

    const clearColumnFilter = (column) => {
        setColumnFilters(prev => ({ ...prev, [column]: [] }));
        setFilterSearch(prev => ({ ...prev, [column]: '' }));
    };

    const clearAllFilters = () => {
        setColumnFilters({ fullName: [], phone: [], email: [], countries: [], course: [], qualification: [], lastFollowUp: [] });
        setFilterSearch({ fullName: '', phone: '', email: '', countries: '', course: '', qualification: '', lastFollowUp: '' });
        setSearchTerm('');
        setStatFilter(null);
    };

    const handleViewChange = (view) => {
        setRecordView(view);
        setStatFilter(null);
        clearAllFilters();
    };

    // ── Apply search + column filters ─────────────────────────────────────────
    const filteredFollowups = followups.filter(f => {
        if (recordView === 'active') {
            if (statFilter === 'recent' && !isRecentFollowup(f)) return false;
            if (statFilter === 'total' && !(f.follow_up_count > 0)) return false;
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesName  = f.full_name?.toLowerCase().includes(term);
            const matchesId    = formatLeadId(f.id).toLowerCase().includes(term);
            const matchesEmail = f.email?.toLowerCase().includes(term);
            if (!matchesName && !matchesId && !matchesEmail) return false;
        }

        if (columnFilters.fullName.length > 0 && !columnFilters.fullName.includes(f.full_name)) return false;
        if (columnFilters.phone.length > 0 && !columnFilters.phone.includes(f.phone)) return false;
        if (columnFilters.email.length > 0 && !columnFilters.email.includes(f.email)) return false;

        // Countries: show lead if it has at least one of the selected countries
        if (columnFilters.countries.length > 0) {
            const leadCountries = parseCountriesArray(f.countries_of_interest);
            if (!columnFilters.countries.some(c => leadCountries.includes(c))) return false;
        }

        if (columnFilters.course.length > 0 && !columnFilters.course.includes(f.course)) return false;
        if (columnFilters.qualification.length > 0 && !columnFilters.qualification.includes(f.qualification)) return false;
        if (columnFilters.lastFollowUp.length > 0) {
            if (!columnFilters.lastFollowUp.includes(formatLastFollowUp(f.last_follow_up))) return false;
        }

        return true;
    });

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
                                <FontAwesomeIcon icon={faHistory} className="page-icon" />
                                Follow-ups Management
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
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className={recordView === 'active' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => handleViewChange('active')}
                        >
                            Active Follow-ups
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
                            Follow-up history for students who have already registered. These records are excluded from follow-up stats.
                        </div>
                    )}

                    {/* Statistics Cards */}
                    {recordView === 'active' && (
                    <div className="stats-grid">
                        <div
                            className="stat-card"
                            onClick={() => handleStatClick('recent')}
                            style={{
                                cursor: 'pointer',
                                border: statFilter === 'recent' ? '2px solid #1976D2' : '2px solid transparent'
                            }}
                        >
                            <div className="stat-icon" style={{ backgroundColor: '#E3F2FD' }}>
                                <FontAwesomeIcon icon={faHistory} style={{ color: '#1976D2' }} />
                            </div>
                            <div className="stat-content">
                                <h3>Recent Follow-ups (7 days)</h3>
                                <p className="stat-number">{recentFollowupsCount}</p>
                            </div>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => handleStatClick('total')}
                            style={{
                                cursor: 'pointer',
                                border: statFilter === 'total' ? '2px solid #F57C00' : '2px solid transparent'
                            }}
                        >
                            <div className="stat-icon" style={{ backgroundColor: '#FFF3E0' }}>
                                <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#F57C00' }} />
                            </div>
                            <div className="stat-content">
                                <h3>Total Follow-up Entries</h3>
                                <p className="stat-number">{totalFollowupsCount}</p>
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
                            placeholder="Search follow-ups..."
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
                            <p>Loading follow-ups...</p>
                        </div>
                    ) : (
                        <>
                            <div className="leads-table-container">
                                <table className="leads-table">
                                    <thead>
                                        <tr>
                                            <th>Lead ID</th>
                                            <th><FilterDropdown column="fullName" label="Full Name" /></th>
                                            <th><FilterDropdown column="phone" label="Contact Number" /></th>
                                            <th><FilterDropdown column="email" label="Email" /></th>
                                            <th><FilterDropdown column="countries" label="Countries" /></th>
                                            <th><FilterDropdown column="course" label="Course" /></th>
                                            <th><FilterDropdown column="qualification" label="Qualification" /></th>
                                            <th>Follow-up Count</th>
                                            <th><FilterDropdown column="lastFollowUp" label="Last Follow-up" /></th>
                                            {recordView === 'registered' && <th>Registered On</th>}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFollowups.length > 0 ? (
                                            filteredFollowups.map((followup) => (
                                                <tr key={followup.id}>
                                                    <td>
                                                        <span className="lead-id">{formatLeadId(followup.id)}</span>
                                                    </td>
                                                    <td><strong>{followup.full_name}</strong></td>
                                                    <td>{followup.phone || '-'}</td>
                                                    <td>{followup.email}</td>
                                                    <td>
                                                        <span style={{ fontSize: '13px', color: '#374151' }}>
                                                            {parseCountriesDisplay(followup.countries_of_interest)}
                                                        </span>
                                                    </td>
                                                    <td>{followup.course || '-'}</td>
                                                    <td>{followup.qualification || '-'}</td>
                                                    <td>
                                                        <span style={{ background: '#F47B20', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                                                            {followup.follow_up_count} {followup.follow_up_count === 1 ? 'Follow-up' : 'Follow-ups'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {followup.last_follow_up
                                                            ? new Date(followup.last_follow_up).toLocaleDateString() + ' ' +
                                                              new Date(followup.last_follow_up).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                    {recordView === 'registered' && (
                                                        <td>
                                                            {followup.registered_at
                                                                ? new Date(followup.registered_at).toLocaleDateString()
                                                                : '—'}
                                                        </td>
                                                    )}
                                                    <td>
                                                        <div className="action-buttons">
                                                            {recordView === 'registered' && followup.student_user_id ? (
                                                                <Link to={`/edit-student/${followup.student_user_id}`} className="btn-icon btn-edit" title="View Student">
                                                                    <FontAwesomeIcon icon={faUserGraduate} />
                                                                </Link>
                                                            ) : null}
                                                            <Link to={`/edit-lead/${followup.id}`} className="btn-icon btn-edit" title={recordView === 'registered' ? 'View Lead History' : 'Edit Lead'}>
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
                                                <td colSpan={recordView === 'registered' ? 11 : 10} style={{ textAlign: 'center', padding: '40px' }}>
                                                    {hasActiveFilters ? 'No follow-ups match the selected filters' : recordView === 'registered' ? 'No registered student follow-up records found' : 'No follow-ups found'}
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