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
  faEdit,
  faTrash,
  faDownload,
  faCheckCircle,
  faHistory,
  faChevronDown,
  faTimes,
  faSearch,
  faUserGraduate,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Followups() {
    const [followups, setFollowups] = useState([]);
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
        purposeOfVisit: []
    });
    const [filterSearch, setFilterSearch] = useState({
        fullName: '',
        phone: '',
        email: '',
        purposeOfVisit: ''
    });
    const [statFilter, setStatFilter] = useState(null);
    const [recordView, setRecordView] = useState('active');
    const [registeredCount, setRegisteredCount] = useState(0);
    const [dateRange, setDateRange] = useState(EMPTY_DATE_RANGE);

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

    const formatFollowUpDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    const isRecentFollowup = (f) => {
        if (!f.last_follow_up) return false;
        const fDate = new Date(f.last_follow_up);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return fDate >= sevenDaysAgo;
    };

    const recentFollowupsCount = recordView === 'active'
        ? followups.filter(isRecentFollowup).length
        : 0;

    const totalFollowupsCount = recordView === 'active'
        ? followups.length
        : 0;

    const handleStatClick = (key) => {
        setStatFilter(prev => (prev === key ? null : key));
    };

    const getUniqueValues = (column) => {
        const values = new Set();
        followups.forEach(f => {
            let value;
            switch (column) {
                case 'fullName':        value = f.full_name; break;
                case 'phone':           value = f.phone || null; break;
                case 'email':           value = f.email || null; break;
                case 'purposeOfVisit':  value = f.purpose_of_visit || null; break;
                default: value = '';
            }
            if (value && value !== 'N/A') values.add(value);
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
        setColumnFilters({ fullName: [], phone: [], email: [], purposeOfVisit: [] });
        setFilterSearch({ fullName: '', phone: '', email: '', purposeOfVisit: '' });
        setSearchTerm('');
        setStatFilter(null);
        setDateRange(EMPTY_DATE_RANGE);
    };

    const handleViewChange = (view) => {
        setRecordView(view);
        setStatFilter(null);
        clearAllFilters();
    };

    const filteredFollowups = followups.filter(f => {
        if (recordView === 'active') {
            if (statFilter === 'recent' && !isRecentFollowup(f)) return false;
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesName  = f.full_name?.toLowerCase().includes(term);
            const matchesId    = formatLeadId(f.id).toLowerCase().includes(term);
            const matchesEmail = f.email?.toLowerCase().includes(term);
            const matchesPurpose = f.purpose_of_visit?.toLowerCase().includes(term);
            if (!matchesName && !matchesId && !matchesEmail && !matchesPurpose) return false;
        }

        if (columnFilters.fullName.length > 0 && !columnFilters.fullName.includes(f.full_name)) return false;
        if (columnFilters.phone.length > 0 && !columnFilters.phone.includes(f.phone)) return false;
        if (columnFilters.email.length > 0 && !columnFilters.email.includes(f.email)) return false;
        if (columnFilters.purposeOfVisit.length > 0 && !columnFilters.purposeOfVisit.includes(f.purpose_of_visit)) return false;
        if (hasDateRange(dateRange) && !isDateInRange(f.last_follow_up, dateRange.from, dateRange.to)) return false;

        return true;
    });

    const { paginatedItems: paginatedFollowups, totalPages, currentPage, goToPage } = useListPagination(
        filteredFollowups,
        [searchTerm, JSON.stringify(columnFilters), dateRange.from, dateRange.to, recordView, statFilter].join('|')
    );

    const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim() || (recordView === 'active' && statFilter) || hasDateRange(dateRange);

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

    const printColumns = [
        { header: 'Lead ID', value: (r) => formatLeadId(r.id) },
        { header: 'Full Name', value: (r) => r.full_name },
        { header: 'Contact Number', value: (r) => r.phone || '-' },
        { header: 'Email Address', value: (r) => r.email },
        { header: 'Purpose of Visit', value: (r) => r.purpose_of_visit || '-' },
        { header: 'Follow-up Date', value: (r) => formatFollowUpDate(r.last_follow_up) },
    ];

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
                            <PrintReportButton
                                show={hasActiveFilters}
                                title={`Follow-ups Management${recordView === 'registered' ? ' — Registered Students' : ''}`}
                                columns={printColumns}
                                rows={filteredFollowups}
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

                    <div className="page-toolbar">
                        <div className="page-search">
                            <FontAwesomeIcon icon={faSearch} className="page-search-icon" />
                            <input
                                type="text"
                                className="page-search-input"
                                placeholder="Search follow-ups..."
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
                            label="Follow-up Date"
                            value={dateRange}
                            onChange={setDateRange}
                        />
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
                                            <th><FilterDropdown column="email" label="Email Address" /></th>
                                            <th><FilterDropdown column="purposeOfVisit" label="Purpose of Visit" /></th>
                                            <th>Follow-up Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFollowups.length > 0 ? (
                                            paginatedFollowups.map((followup) => (
                                                <tr key={followup.follow_up_id || `${followup.id}-${followup.follow_up_number}`}>
                                                    <td>
                                                        <span className="lead-id">{formatLeadId(followup.id)}</span>
                                                    </td>
                                                    <td>
                                                        <Link to={`/edit-lead/${followup.id}`} className="table-name-link">
                                                            {followup.full_name}
                                                        </Link>
                                                    </td>
                                                    <td>{followup.phone || '-'}</td>
                                                    <td>{followup.email}</td>
                                                    <td>{followup.purpose_of_visit || '-'}</td>
                                                    <td>{formatFollowUpDate(followup.last_follow_up)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="btn-icon btn-view"
                                                                title="View Follow-up"
                                                                onClick={() => setViewRecordId(followup.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            {recordView === 'registered' && followup.student_user_id ? (
                                                                <Link to={`/edit-student/${followup.student_user_id}`} className="btn-icon btn-edit" title="View Student">
                                                                    <FontAwesomeIcon icon={faUserGraduate} />
                                                                </Link>
                                                            ) : null}
                                                            <Link to={`/edit-lead/${followup.id}`} className="btn-icon btn-edit" title={recordView === 'registered' ? 'View Lead History' : 'Edit Lead'}>
                                                                <FontAwesomeIcon icon={recordView === 'registered' ? faHistory : faEdit} />
                                                            </Link>
                                                            <button className="btn-icon btn-delete" title="Delete">
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                                    {hasActiveFilters ? 'No follow-ups match the selected filters' : recordView === 'registered' ? 'No registered student follow-up records found' : 'No follow-ups found'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <ListPagination
                                total={filteredFollowups.length}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                itemLabel="follow-up"
                            />
                        </>
                    )}
                </div>
            </div>
            {viewRecordId && (
                <ViewRecordModal title="View Follow-up" onClose={() => setViewRecordId(null)}>
                    <EditLead recordId={viewRecordId} viewOnly />
                </ViewRecordModal>
            )}
        </>
    );
}
