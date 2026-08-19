import React, { useState, useEffect, useRef } from 'react'
import '../styles/dashboard.css'
import '../styles/logs.css'
import '../styles/leads.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PrintReportButton from '../components/PrintReportButton'
import DateRangeFilter from '../components/DateRangeFilter'
import ViewRecordModal from '../components/ViewRecordModal'
import EditLog from './EditLog'
import ListPagination from '../components/ListPagination'
import useListPagination from '../hooks/useListPagination'
import { EMPTY_DATE_RANGE, hasDateRange, isDateInRange } from '../utils/dateRange'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faSignOutAlt,
  faChevronDown,
  faTimes,
  faEye,
  faHistory
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function VisitorLogs() {
    const [visitorLogs, setVisitorLogs] = useState([]);
    const [viewRecordId, setViewRecordId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(EMPTY_DATE_RANGE);
    const [activeFilter, setActiveFilter] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [columnFilters, setColumnFilters] = useState({
        visitorName: [], visitorType: [], status: [], followupName: [], purposeOfVisit: []
    });
    const [filterSearch, setFilterSearch] = useState({
        visitorName: '', visitorType: '', status: '', followupName: '', purposeOfVisit: ''
    });
    
    const [stats, setStats] = useState({
        totalVisitors: 0,
        todayVisitors: 0,
        currentlyInOffice: 0
    });
    const [logView, setLogView] = useState('logs');
    const [followups, setFollowups] = useState([]);

    useEffect(() => {
        if (logView === 'logs') {
            fetchVisitorLogs();
        } else {
            fetchFollowupVisitors();
        }
    }, [logView]);

    const fetchFollowupVisitors = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/leads/followups?view=all`);
            const data = await response.json();
            if (data.success) {
                setFollowups(data.followups || []);
            } else {
                setError(data.message || 'Failed to fetch follow-up visitors');
            }
        } catch (err) {
            console.error('Error fetching follow-up visitors:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.filter-dropdown-container')) {
                setActiveFilter(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchVisitorLogs = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_URL}/visitor-logs`);
            const data = await response.json();
            
            if (data.success) {
                setVisitorLogs(data.logs);
                setStats(data.stats);
            } else {
                setError(data.message || 'Failed to fetch visitor logs');
            }
        } catch (err) {
            console.error('Error fetching visitor logs:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (logId, visitorName) => {
        if (!window.confirm(`Are you sure you want to delete the log for ${visitorName}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/visitor-logs/${logId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                alert('Visitor log deleted successfully');
                fetchVisitorLogs();
            } else {
                alert(data.message || 'Failed to delete visitor log');
            }
        } catch (err) {
            console.error('Error deleting visitor log:', err);
            alert('Network error. Please try again.');
        }
    };

    const handleCheckout = async (logId) => {
        const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
        
        if (!window.confirm('Mark this visitor as checked out?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/visitor-logs/${logId}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ timeOut: currentTime })
            });
            const data = await response.json();
            
            if (data.success) {
                alert('Visitor checked out successfully');
                fetchVisitorLogs();
            } else {
                alert(data.message || 'Failed to check out visitor');
            }
        } catch (err) {
            console.error('Error checking out visitor:', err);
            alert('Network error. Please try again.');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Completed':
                return 'status-completed';
            case 'In Progress':
                return 'status-in-progress';
            case 'Cancelled':
                return 'status-cancelled';
            default:
                return '';
        }
    };

    const getVisitorTypeClass = (type) => {
        switch (type) {
            case 'Student':
                return 'visitor-type-student';
            case 'Counselor':
                return 'visitor-type-counselor';
            case 'Maintenance':
                return 'visitor-type-maintenance';
            case 'Parent':
                return 'visitor-type-parent';
            case 'Vendor':
                return 'visitor-type-vendor';
            default:
                return '';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getUniqueValues = (column) => {
        const values = new Set();
        if (column === 'followupName' || column === 'purposeOfVisit') {
            followups.forEach(fu => {
                let value;
                if (column === 'followupName') value = fu.full_name;
                else if (column === 'purposeOfVisit') value = fu.purpose_of_visit || '-';
                if (value) values.add(value);
            });
        } else {
            visitorLogs.forEach(log => {
                let value;
                if (column === 'visitorName') value = log.visitor_name;
                else if (column === 'visitorType') value = log.visitor_type;
                else if (column === 'status') value = log.status;
                if (value) values.add(value);
            });
        }
        return Array.from(values).sort((a, b) => String(a).localeCompare(String(b)));
    };

    const getFilteredOptions = (column) => {
        const unique = getUniqueValues(column);
        const term = (filterSearch[column] || '').toLowerCase();
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
        setColumnFilters({ visitorName: [], visitorType: [], status: [], followupName: [], purposeOfVisit: [] });
        setFilterSearch({ visitorName: '', visitorType: '', status: '', followupName: '', purposeOfVisit: '' });
        setSearchQuery('');
        setDateRange(EMPTY_DATE_RANGE);
    };

    const filteredLogs = visitorLogs.filter(log => {
        if (searchQuery.trim()) {
            const term = searchQuery.toLowerCase();
            const matches = (
                log.visitor_name?.toLowerCase().includes(term) ||
                log.contact_no?.toLowerCase().includes(term) ||
                log.log_id?.toLowerCase().includes(term)
            );
            if (!matches) return false;
        }
        if (columnFilters.visitorName.length > 0 && !columnFilters.visitorName.includes(log.visitor_name)) return false;
        if (columnFilters.visitorType.length > 0 && !columnFilters.visitorType.includes(log.visitor_type)) return false;
        if (columnFilters.status.length > 0 && !columnFilters.status.includes(log.status)) return false;
        if (hasDateRange(dateRange) && !isDateInRange(log.visit_date, dateRange.from, dateRange.to)) return false;
        return true;
    });

    const filteredFollowups = followups.filter(fu => {
        if (searchQuery.trim()) {
            const term = searchQuery.toLowerCase();
            const matches = (
                fu.full_name?.toLowerCase().includes(term) ||
                fu.email?.toLowerCase().includes(term) ||
                (fu.purpose_of_visit || '').toLowerCase().includes(term)
            );
            if (!matches) return false;
        }
        if (columnFilters.followupName.length > 0 && !columnFilters.followupName.includes(fu.full_name)) return false;
        const purposeValue = fu.purpose_of_visit || '-';
        if (columnFilters.purposeOfVisit.length > 0 && !columnFilters.purposeOfVisit.includes(purposeValue)) return false;
        if (hasDateRange(dateRange) && !isDateInRange(fu.last_follow_up, dateRange.from, dateRange.to)) return false;
        return true;
    });

    const listItems = logView === 'followups' ? filteredFollowups : filteredLogs;
    const { paginatedItems, totalPages, currentPage, goToPage } = useListPagination(
        listItems,
        [logView, searchQuery, JSON.stringify(columnFilters), dateRange.from, dateRange.to].join('|')
    );

    const hasActiveFilters = logView === 'followups'
        ? Boolean(searchQuery.trim() || hasDateRange(dateRange) || columnFilters.followupName.length > 0 || columnFilters.purposeOfVisit.length > 0)
        : Boolean(columnFilters.visitorName.length > 0 || columnFilters.visitorType.length > 0 || columnFilters.status.length > 0 || searchQuery.trim() || hasDateRange(dateRange));

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
            if (left + 280 > window.innerWidth) left = window.innerWidth - 300;
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
                                        if (e.target.checked) setColumnFilters(prev => ({ ...prev, [column]: allOptions }));
                                        else clearColumnFilter(column);
                                    }}
                                />
                                <span className="filter-label">Select All</span>
                            </label>
                            {filteredOptions.length > 0 ? filteredOptions.map((value, i) => (
                                <label key={i} className="filter-option">
                                    <input
                                        type="checkbox"
                                        checked={columnFilters[column].includes(value)}
                                        onChange={() => toggleFilterValue(column, value)}
                                    />
                                    <span className="filter-label">{value}</span>
                                </label>
                            )) : (
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

    const printColumns = logView === 'followups'
        ? [
            { header: 'Name', value: (r) => r.full_name },
            { header: 'Email', value: (r) => r.email || '-' },
            { header: 'Purpose of Visit', value: (r) => r.purpose_of_visit || '-' },
            { header: 'Date', value: (r) => formatDate(r.last_follow_up) },
          ]
        : [
            { header: 'Log ID', value: (r) => r.log_id },
            { header: 'Visitor Name', value: (r) => r.visitor_name },
            { header: 'Visitor Type', value: (r) => r.visitor_type },
            { header: 'Contact', value: (r) => r.contact_no },
            { header: 'Visit Date', value: (r) => formatDate(r.visit_date) },
            { header: 'Time In', value: (r) => r.time_in || '-' },
            { header: 'Time Out', value: (r) => r.time_out || '-' },
            { header: 'Status', value: (r) => r.status },
          ];

    return (
        <>
            <Sidebar />

            <div className="main-content" id="mainContent">
                <Header />

                <div className="logs-container">
                    <div className="logs-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faClipboardList} className="page-icon" />
                                Visitor Logs Management
                            </h1>
                        </div>
                        <div className="header-right">
                            <PrintReportButton
                                show={hasActiveFilters}
                                title={logView === 'followups' ? 'Follow-up Visitors' : 'Visitor Logs Management'}
                                columns={printColumns}
                                rows={listItems}
                            />
                            {hasActiveFilters && (
                                <button className="btn-clear-all-filters" onClick={clearAllFilters}>
                                    <FontAwesomeIcon icon={faTimes} />
                                    Clear All Filters
                                </button>
                            )}
                            {logView === 'logs' && (
                                <Link to="/add-log" className="btn-primary">
                                    <FontAwesomeIcon icon={faPlus} />
                                    Add New Log
                                </Link>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className={logView === 'logs' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setLogView('logs')}
                        >
                            <FontAwesomeIcon icon={faClipboardList} style={{ marginRight: '8px' }} />
                            Visitor Logs
                        </button>
                        <button
                            type="button"
                            className={logView === 'followups' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setLogView('followups')}
                        >
                            <FontAwesomeIcon icon={faHistory} style={{ marginRight: '8px' }} />
                            Follow-up Visitors
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            border: '1px solid #fecaca',
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="page-toolbar">
                        <div className="page-search">
                            <FontAwesomeIcon icon={faSearch} className="page-search-icon" />
                            <input
                                type="text"
                                className="page-search-input"
                                placeholder={logView === 'followups'
                                    ? 'Search by name, email, or purpose...'
                                    : 'Search by name, contact, or visitor ID...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button type="button" className="page-search-clear" onClick={() => setSearchQuery('')}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}
                        </div>
                        <DateRangeFilter
                            label={logView === 'followups' ? 'Follow-up Date' : 'Visit Date'}
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>{logView === 'followups' ? 'Loading follow-up visitors...' : 'Loading visitor logs...'}</p>
                        </div>
                    ) : logView === 'followups' ? (
                        <>
                            <div className="logs-table-container">
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th><FilterDropdown column="followupName" label="Name" /></th>
                                            <th>Email</th>
                                            <th><FilterDropdown column="purposeOfVisit" label="Purpose of Visit" /></th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFollowups.length > 0 ? (
                                            paginatedItems.map((fu) => (
                                                <tr key={fu.follow_up_id}>
                                                    <td>{fu.full_name || '-'}</td>
                                                    <td>{fu.email || '-'}</td>
                                                    <td>{fu.purpose_of_visit || '-'}</td>
                                                    <td>{fu.last_follow_up ? formatDate(fu.last_follow_up) : '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                                    {hasActiveFilters ? 'No follow-up visitors match the selected filters' : 'No follow-up visitors found'}
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
                                itemLabel="follow-up visitor"
                            />
                        </>
                    ) : (
                        <>
                            <div className="logs-table-container">
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th>Log ID</th>
                                            <th><FilterDropdown column="visitorName" label="Visitor Name" /></th>
                                            <th><FilterDropdown column="visitorType" label="Visitor Type" /></th>
                                            <th>Contact</th>
                                            <th>Visit Date</th>
                                            <th>Time In</th>
                                            <th>Time Out</th>
                                            <th><FilterDropdown column="status" label="Status" /></th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.length > 0 ? (
                                            paginatedItems.map((log) => (
                                                <tr key={log.id}>
                                                    <td>
                                                        <span className="log-id">{log.log_id}</span>
                                                    </td>
                                                    <td>
                                                        <div className="visitor-info">
                                                            <Link to={`/edit-log/${log.id}`} className="table-name-link">
                                                                {log.visitor_name}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`visitor-type-badge ${getVisitorTypeClass(log.visitor_type)}`}>
                                                            {log.visitor_type}
                                                        </span>
                                                    </td>
                                                    <td>{log.contact_no}</td>
                                                    <td>{formatDate(log.visit_date)}</td>
                                                    <td><span className="time-badge">{log.time_in}</span></td>
                                                    <td>
                                                        {log.time_out ? (
                                                            <span className="time-badge">{log.time_out}</span>
                                                        ) : (
                                                            <span className="time-badge time-pending">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${getStatusClass(log.status)}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                type="button"
                                                                className="btn-icon btn-view"
                                                                title="View Log"
                                                                onClick={() => setViewRecordId(log.id)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            {log.status === 'In Progress' && (
                                                                <button 
                                                                    className="btn-icon btn-success" 
                                                                    title="Check Out"
                                                                    onClick={() => handleCheckout(log.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                                                </button>
                                                            )}
                                                            <Link 
                                                                to={`/edit-log/${log.id}`} 
                                                                className="btn-icon btn-edit" 
                                                                title="Edit Log"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Link>
                                                            <button 
                                                                className="btn-icon btn-delete" 
                                                                title="Delete Log"
                                                                onClick={() => handleDelete(log.id, log.visitor_name)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                                                    {hasActiveFilters ? 'No visitor logs match the selected filters' : 'No visitor logs found'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <ListPagination
                                total={filteredLogs.length}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                itemLabel="visitor log"
                            />
                        </>
                    )}
                </div>
            </div>
            {viewRecordId && (
                <ViewRecordModal title="View Visitor Log" onClose={() => setViewRecordId(null)}>
                    <EditLog recordId={viewRecordId} viewOnly />
                </ViewRecordModal>
            )}
        </>
    )
}