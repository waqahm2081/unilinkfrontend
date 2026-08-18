import React, { useState, useEffect, useRef } from 'react'
import '../styles/dashboard.css'
import '../styles/visa.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PrintReportButton from '../components/PrintReportButton'
import DateRangeFilter from '../components/DateRangeFilter'
import ViewRecordModal from '../components/ViewRecordModal'
import EditVisa from './EditVisa'
import ListPagination from '../components/ListPagination'
import useListPagination from '../hooks/useListPagination'
import { EMPTY_DATE_RANGE, hasDateRange, isDateInRange } from '../utils/dateRange'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPassport, faPlus, faEdit, faTrash, faSearch, faChevronDown, faTimes, faEye,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const getStatusBadgeStyle = (status) => {
    const styles = {
        'To be applied': { background: '#f3f4f6', color: '#374151' },
        'In Progress':   { background: '#fef9c3', color: '#854d0e' },
        'Approved':      { background: '#dcfce7', color: '#166534' },
        'Rejected':      { background: '#fee2e2', color: '#991b1b' },
    };
    return styles[status] || { background: '#f3f4f6', color: '#374151' };
};

const getVisaTypeStyle = (type) => {
    const styles = {
        'Study Visa': { background: '#dbeafe', color: '#1e40af' },
        'Work Visa':  { background: '#ede9fe', color: '#4c1d95' },
        'Visitor':    { background: '#fef9c3', color: '#854d0e' },
        'Exchange':   { background: '#d1fae5', color: '#065f46' },
    };
    return styles[type] || { background: '#f3f4f6', color: '#374151' };
};

// NEW: maps a stat card key to the actual visa_status value it represents
const STAT_STATUS_MAP = {
    to_be_applied: 'To be applied',
    in_progress:   'In Progress',
    approved:      'Approved',
    rejected:      'Rejected',
};

export default function Visa() {
    const [visas, setVisas] = useState([]);
    const [viewRecordId, setViewRecordId] = useState(null);
    const [statistics, setStatistics] = useState({ total: 0, to_be_applied: 0, in_progress: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [columnFilters, setColumnFilters] = useState({
        studentName: [], country: [], institute: [], visaType: [], submittedBy: [], status: []
    });
    const [filterSearch, setFilterSearch] = useState({
        studentName: '', country: '', institute: '', visaType: '', submittedBy: '', status: ''
    });
    // NEW: tracks which stat card is active ('to_be_applied' | 'in_progress' | 'approved' | 'rejected' | null)
    const [statFilter, setStatFilter] = useState(null);
    const [dateRange, setDateRange] = useState(EMPTY_DATE_RANGE);

    useEffect(() => { fetchVisas(); fetchStatistics(); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.filter-dropdown-container')) setActiveFilter(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchVisas = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/visas`);
            const data = await response.json();
            if (data.success) setVisas(data.visas);
            else setError(data.message || 'Failed to fetch visas');
        } catch (error) {
            setError('Failed to load visas');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch(`${API_URL}/visas/statistics`);
            const data = await response.json();
            if (data.success) setStatistics(data.statistics);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleDelete = async (visaId, visaIdText) => {
        if (!window.confirm(`Are you sure you want to delete visa ${visaIdText}?`)) return;
        try {
            const response = await fetch(`${API_URL}/visas/${visaId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) { fetchVisas(); fetchStatistics(); }
            else setError(data.message || 'Failed to delete visa');
        } catch (error) {
            setError('Failed to delete visa');
        }
    };

    // NEW: handles clicking a stat card
    const handleStatClick = (key) => {
        setStatFilter(prev => (prev === key ? null : key));
    };

    const getUniqueValues = (column) => {
        const values = new Set();
        visas.forEach(v => {
            let value;
            switch (column) {
                case 'studentName':    value = v.student_name; break;
                case 'country':        value = v.student_country; break;
                case 'institute':      value = v.institute || null; break;
                case 'visaType':       value = v.visa_type; break;
                case 'submittedBy':    value = v.submitted_by || null; break;
                case 'status':         value = v.visa_status; break;
                default: value = '';
            }
            if (value) values.add(value);
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
        setColumnFilters({ studentName: [], country: [], institute: [], visaType: [], submittedBy: [], status: [] });
        setFilterSearch({ studentName: '', country: '', institute: '', visaType: '', submittedBy: '', status: '' });
        setSearchTerm('');
        setStatFilter(null); // NEW: also clear stat filter
        setDateRange(EMPTY_DATE_RANGE);
    };

    const filteredVisas = visas.filter(v => {
        // NEW: stat card filter
        if (statFilter && v.visa_status !== STAT_STATUS_MAP[statFilter]) return false;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            if (
                !v.visa_id?.toLowerCase().includes(term) &&
                !v.student_name?.toLowerCase().includes(term) &&
                !v.student_id?.toLowerCase().includes(term) &&
                !v.institute?.toLowerCase().includes(term) &&
                !v.submitted_by?.toLowerCase().includes(term)
            ) return false;
        }
        if (columnFilters.studentName.length > 0 && !columnFilters.studentName.includes(v.student_name)) return false;
        if (columnFilters.country.length > 0 && !columnFilters.country.includes(v.student_country)) return false;
        if (columnFilters.institute.length > 0 && !columnFilters.institute.includes(v.institute)) return false;
        if (columnFilters.visaType.length > 0 && !columnFilters.visaType.includes(v.visa_type)) return false;
        if (columnFilters.submittedBy.length > 0 && !columnFilters.submittedBy.includes(v.submitted_by)) return false;
        if (columnFilters.status.length > 0 && !columnFilters.status.includes(v.visa_status)) return false;
        if (hasDateRange(dateRange) && !isDateInRange(v.submission_date, dateRange.from, dateRange.to)) return false;
        return true;
    });

    const { paginatedItems: paginatedVisas, totalPages, currentPage, goToPage } = useListPagination(
        filteredVisas,
        [searchTerm, JSON.stringify(columnFilters), dateRange.from, dateRange.to, statFilter].join('|')
    );

    const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim() || statFilter || hasDateRange(dateRange);

    const FilterDropdown = ({ column, label }) => {
        const triggerRef = useRef(null);
        const isActive = activeFilter === column;
        const hasFilters = columnFilters[column].length > 0;
        const filteredOptions = getFilteredOptions(column);
        const allOptions = getUniqueValues(column);

        const handleToggle = () => {
            if (isActive) { setActiveFilter(null); return; }
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownHeight = 380;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            let top = (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove)
                ? rect.bottom + 8
                : rect.top - dropdownHeight - 8;
            let left = rect.left;
            const dropdownWidth = 280;
            if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 20;
            setDropdownPosition({ top, left });
            setActiveFilter(column);
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
                    <div
                        className="filter-dropdown"
                        style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                    >
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
                                        if (e.target.checked) setColumnFilters(prev => ({ ...prev, [column]: allOptions }));
                                        else clearColumnFilter(column);
                                    }}
                                />
                                <span className="filter-label">Select All</span>
                            </label>
                            {filteredOptions.length > 0
                                ? filteredOptions.map((value, i) => (
                                    <label key={i} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={columnFilters[column].includes(value)}
                                            onChange={() => toggleFilterValue(column, value)}
                                        />
                                        <span className="filter-label">{value}</span>
                                    </label>
                                ))
                                : <div className="no-results">No results found</div>
                            }
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

    // NEW: reusable styled stat card so all 4 toggle consistently
    const StatCard = ({ statKey, icon, bg, color, label, value }) => (
        <div
            className="stat-card"
            onClick={() => handleStatClick(statKey)}
            style={{
                cursor: 'pointer',
                border: statFilter === statKey ? `2px solid ${color}` : '2px solid transparent'
            }}
        >
            <div className="stat-icon" style={{ backgroundColor: bg }}>
                <FontAwesomeIcon icon={icon} style={{ color }} />
            </div>
            <div className="stat-content">
                <h3>{label}</h3>
                <p className="stat-number">{value ?? 0}</p>
            </div>
        </div>
    );

    const printColumns = [
        { header: 'Visa ID', value: (r) => r.visa_id },
        { header: 'Student Name', value: (r) => r.student_name },
        { header: 'Student ID', value: (r) => r.student_id || '-' },
        { header: 'Country', value: (r) => r.student_country || '-' },
        { header: 'Institute', value: (r) => r.institute || '-' },
        { header: 'Visa Type', value: (r) => r.visa_type },
        {
            header: 'Submission Date',
            value: (r) => (r.submission_date ? new Date(r.submission_date).toLocaleDateString() : '-'),
        },
        { header: 'Submitted By', value: (r) => r.submitted_by || '-' },
        { header: 'Status', value: (r) => r.visa_status },
    ];

    return (
        <>
            <Sidebar />
            <div className="main-content" id="mainContent">
                <Header />

                <div className="visa-container">
                    <div className="visa-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faPassport} className="page-icon" />
                                Visa Management
                            </h1>
                        </div>
                        <div className="header-right">
                            <PrintReportButton
                                show={hasActiveFilters}
                                title="Visa Management"
                                columns={printColumns}
                                rows={filteredVisas}
                            />
                            {hasActiveFilters && (
                                <button className="btn-clear-all-filters" onClick={clearAllFilters}>
                                    <FontAwesomeIcon icon={faTimes} /> Clear All Filters
                                </button>
                            )}
                            <Link to="/create-visa" className="btn-primary">
                                <FontAwesomeIcon icon={faPlus} />
                                New Visa
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                        <StatCard
                            statKey="to_be_applied"
                            icon={faPassport}
                            bg="#f3f4f6"
                            color="#6b7280"
                            label="To Be Applied"
                            value={statistics.to_be_applied}
                        />
                        <StatCard
                            statKey="in_progress"
                            icon={faPassport}
                            bg="#fef9c3"
                            color="#b45309"
                            label="In Progress"
                            value={statistics.in_progress}
                        />
                        <StatCard
                            statKey="approved"
                            icon={faPassport}
                            bg="#dcfce7"
                            color="#166534"
                            label="Approved"
                            value={statistics.approved}
                        />
                        <StatCard
                            statKey="rejected"
                            icon={faPassport}
                            bg="#fee2e2"
                            color="#991b1b"
                            label="Rejected"
                            value={statistics.rejected}
                        />
                    </div>

                    <div className="page-toolbar">
                        <div className="page-search">
                            <FontAwesomeIcon icon={faSearch} className="page-search-icon" />
                            <input
                                type="text"
                                className="page-search-input"
                                placeholder="Search by visa ID, student name, institute, or submitted by..."
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
                            label="Submission Date"
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <p style={{ color: '#6b7280' }}>Loading visas...</p>
                        </div>
                    ) : (
                        <>
                        <div className="visa-table-container">
                            <table className="visa-table">
                                <thead>
                                    <tr>
                                        <th>Visa ID</th>
                                        <th><FilterDropdown column="studentName" label="Student Name" /></th>
                                        <th><FilterDropdown column="country" label="Country" /></th>
                                        <th><FilterDropdown column="institute" label="Institute" /></th>
                                        <th><FilterDropdown column="visaType" label="Visa Type" /></th>
                                        <th>Submission Date</th>
                                        <th><FilterDropdown column="submittedBy" label="Submitted By" /></th>
                                        <th><FilterDropdown column="status" label="Status" /></th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVisas.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                                {hasActiveFilters ? 'No visas match the selected filters' : 'No visas found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVisas.map((visa) => {
                                            const statusStyle = getStatusBadgeStyle(visa.visa_status);
                                            const typeStyle = getVisaTypeStyle(visa.visa_type);
                                            return (
                                                <tr key={visa.id}>
                                                    <td>
                                                        <span className="visa-id">{visa.visa_id}</span>
                                                    </td>
                                                    <td>
                                                        <Link to={`/edit-visa/${visa.id}`} className="table-name-link">
                                                            {visa.student_name}
                                                        </Link>
                                                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                                            {visa.student_id}
                                                        </div>
                                                    </td>
                                                    <td>{visa.student_country || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                                                    <td>{visa.institute || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '2px 10px', borderRadius: '20px',
                                                            fontSize: '11px', fontWeight: '600', ...typeStyle
                                                        }}>
                                                            {visa.visa_type}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {visa.submission_date
                                                            ? new Date(visa.submission_date).toLocaleDateString()
                                                            : <span style={{ color: '#9ca3af' }}>-</span>
                                                        }
                                                    </td>
                                                    <td>{visa.submitted_by || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '3px 10px', borderRadius: '20px',
                                                            fontSize: '11px', fontWeight: '600', ...statusStyle
                                                        }}>
                                                            {visa.visa_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="btn-icon btn-view"
                                                                title="View Visa"
                                                                onClick={() => setViewRecordId(visa.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <Link to={`/edit-visa/${visa.id}`} className="btn-icon btn-edit" title="Edit Visa">
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button
                                                                className="btn-icon btn-delete"
                                                                title="Delete Visa"
                                                                onClick={() => handleDelete(visa.id, visa.visa_id)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <ListPagination
                            total={filteredVisas.length}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={goToPage}
                            itemLabel="visa"
                        />
                        </>
                    )}
                </div>
            </div>
            {viewRecordId && (
                <ViewRecordModal title="View Visa" onClose={() => setViewRecordId(null)}>
                    <EditVisa recordId={viewRecordId} viewOnly />
                </ViewRecordModal>
            )}
        </>
    );
}