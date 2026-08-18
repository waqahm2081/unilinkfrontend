import React, { useState, useEffect, useRef } from 'react';
import '../styles/dashboard.css';
import '../styles/applications.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PrintReportButton from '../components/PrintReportButton';
import DateRangeFilter from '../components/DateRangeFilter';
import ViewRecordModal from '../components/ViewRecordModal';
import EditApplication from './EditApplication';
import ListPagination from '../components/ListPagination';
import useListPagination from '../hooks/useListPagination';
import { EMPTY_DATE_RANGE, hasDateRange, isDateInRange } from '../utils/dateRange';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt, faPlus, faEdit, faTrash, faSearch, faDownload,
  faClock, faChevronDown, faTimes, faEye,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const getStatusStyle = (status) => {
  const styles = {
    'Pending':    { background: '#fef9c3', color: '#854d0e' },
    'Approved':   { background: '#dcfce7', color: '#166534' },
    'Accepted':   { background: '#dbeafe', color: '#1e40af' },
    'Rejected':   { background: '#fee2e2', color: '#991b1b' },
    'Withdrawn':  { background: '#f3e8ff', color: '#6b21a8' },
    'Closed':     { background: '#f3f4f6', color: '#374151' },
  };
  return styles[status] || { background: '#f3f4f6', color: '#374151' };
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [viewRecordId, setViewRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total_applications: 0, pending_applications: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [columnFilters, setColumnFilters] = useState({
    studentName: [], country: [], university: [], intake: [], status: []
  });
  const [filterSearch, setFilterSearch] = useState({
    studentName: '', country: '', university: '', intake: '', status: ''
  });
  // tracks which stat card is active ('total' | 'pending' | null)
  const [statFilter, setStatFilter] = useState(null);
  const [dateRange, setDateRange] = useState(EMPTY_DATE_RANGE);

  useEffect(() => { fetchApplications(); fetchStats(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.filter-dropdown-container')) setActiveFilter(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/applications`);
      const data = await response.json();
      if (data.success) setApplications(data.applications);
      else setError(data.message || 'Failed to fetch applications');
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/applications/stats/overview`);
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (id, applicationId) => {
    if (!window.confirm(`Are you sure you want to delete application ${applicationId}?`)) return;
    try {
      const response = await fetch(`${API_URL}/applications/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) { fetchApplications(); fetchStats(); }
      else alert(data.message || 'Failed to delete application');
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleStatClick = (key) => {
    setStatFilter(prev => (prev === key ? null : key));
  };

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const getUniqueValues = (column) => {
    const values = new Set();
    applications.forEach(app => {
      let value;
      switch (column) {
        case 'studentName': value = app.student_name || app.student_full_name; break;
        case 'country':     value = app.country_name; break;
        case 'university':  value = app.university_name; break;
        case 'intake':      value = app.intake_name; break;
        case 'status':      value = app.application_status; break;
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
    setColumnFilters({ studentName: [], country: [], university: [], intake: [], status: [] });
    setFilterSearch({ studentName: '', country: '', university: '', intake: '', status: '' });
    setSearchTerm('');
    setStatFilter(null);
    setDateRange(EMPTY_DATE_RANGE);
  };

  const filteredApplications = applications.filter(app => {
    // stat card filter
    if (statFilter === 'pending' && app.application_status !== 'Pending') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = (app.student_name || app.student_full_name || '').toLowerCase();
      if (
        !app.application_id?.toLowerCase().includes(term) &&
        !name.includes(term) &&
        !app.university_name?.toLowerCase().includes(term) &&
        !app.country_name?.toLowerCase().includes(term)
      ) return false;
    }
    const name = app.student_name || app.student_full_name;
    if (columnFilters.studentName.length > 0 && !columnFilters.studentName.includes(name)) return false;
    if (columnFilters.country.length > 0 && !columnFilters.country.includes(app.country_name)) return false;
    if (columnFilters.university.length > 0 && !columnFilters.university.includes(app.university_name)) return false;
    if (columnFilters.intake.length > 0 && !columnFilters.intake.includes(app.intake_name)) return false;
    if (columnFilters.status.length > 0 && !columnFilters.status.includes(app.application_status)) return false;
    if (hasDateRange(dateRange) && !isDateInRange(app.created_at, dateRange.from, dateRange.to)) return false;
    return true;
  });

  const { paginatedItems: paginatedApplications, totalPages, currentPage, goToPage } = useListPagination(
    filteredApplications,
    [searchTerm, JSON.stringify(columnFilters), dateRange.from, dateRange.to, statFilter].join('|')
  );

  const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim() || statFilter || hasDateRange(dateRange);

  // ── FilterDropdown ─────────────────────────────────────────────────────────
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

  const printColumns = [
    { header: 'Application ID', value: (r) => r.application_id },
    { header: 'Student Name', value: (r) => r.student_name || r.student_full_name },
    { header: 'Student ID', value: (r) => r.student_number || '-' },
    { header: 'Country', value: (r) => r.country_name || '-' },
    { header: 'University', value: (r) => r.university_name || 'Not set' },
    { header: 'Intake', value: (r) => r.intake_name || 'Not set' },
    { header: 'Status', value: (r) => r.application_status },
    {
      header: 'Application Date',
      value: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'),
    },
  ];

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="counselors-container">
          {/* Header */}
          <div className="counselors-header">
            <div className="header-left">
              <h1>
                <FontAwesomeIcon icon={faFileAlt} className="page-icon" />
                Applications Management
              </h1>
            </div>
            <div className="header-right">
              <PrintReportButton
                show={hasActiveFilters}
                title="Applications Management"
                columns={printColumns}
                rows={filteredApplications}
              />
              {hasActiveFilters && (
                <button className="btn-clear-all-filters" onClick={clearAllFilters}>
                  <FontAwesomeIcon icon={faTimes} /> Clear All Filters
                </button>
              )}
              <button className="btn-secondary">
                <FontAwesomeIcon icon={faDownload} /> Export
              </button>
              <Link to="/create-application" className="btn-primary">
                <FontAwesomeIcon icon={faPlus} /> Add Application
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
            <div
              className="stat-card"
              onClick={() => handleStatClick('total')}
              style={{
                cursor: 'pointer',
                border: statFilter === 'total' ? '2px solid #1976D2' : '2px solid transparent'
              }}
            >
              <div className="stat-icon" style={{ backgroundColor: '#E3F2FD' }}>
                <FontAwesomeIcon icon={faFileAlt} style={{ color: '#1976D2' }} />
              </div>
              <div className="stat-content">
                <h3>Total Applications</h3>
                <p className="stat-number">{stats.total_applications}</p>
              </div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatClick('pending')}
              style={{
                cursor: 'pointer',
                border: statFilter === 'pending' ? '2px solid #F57C00' : '2px solid transparent'
              }}
            >
              <div className="stat-icon" style={{ backgroundColor: '#FFF3E0' }}>
                <FontAwesomeIcon icon={faClock} style={{ color: '#F57C00' }} />
              </div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p className="stat-number">{stats.pending_applications}</p>
              </div>
            </div>
          </div>

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
                placeholder="Search by application ID, student name, university, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="page-search-clear" onClick={() => setSearchTerm('')}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
            <DateRangeFilter
              label="Application Date"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading applications...</p>
            </div>
          ) : (
            <>
            <div className="counselors-table-container">
              <table className="counselors-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th><FilterDropdown column="studentName" label="Student Name" /></th>
                    <th><FilterDropdown column="country" label="Country" /></th>
                    <th><FilterDropdown column="university" label="University" /></th>
                    <th><FilterDropdown column="intake" label="Intake" /></th>
                    <th><FilterDropdown column="status" label="Status" /></th>
                    <th>Application Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length > 0 ? (
                    paginatedApplications.map((app) => {
                      const statusStyle = getStatusStyle(app.application_status);
                      return (
                        <tr key={app.id}>
                          <td>
                            <span className="counselor-id">{app.application_id}</span>
                          </td>
                          <td>
                            <Link to={`/edit-application/${app.id}`} className="table-name-link">
                              {app.student_name || app.student_full_name}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                              {app.student_number}
                            </div>
                          </td>
                          <td>{app.country_name || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                          <td>{app.university_name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>}</td>
                          <td>{app.intake_name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>}</td>
                          <td>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...statusStyle }}>
                              {app.application_status}
                            </span>
                          </td>
                          <td>
                            {app.created_at
                              ? new Date(app.created_at).toLocaleDateString()
                              : <span style={{ color: '#9ca3af' }}>-</span>}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn-icon btn-view"
                                title="View Application"
                                onClick={() => setViewRecordId(app.id)}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {/* View — opens student summary page */}
                              <Link
                                to={`/student-applications/${app.student_id}`}
                                className="btn-icon btn-view"
                                title="View Student Applications"
                                style={{ color: '#F47B20' }}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                              <Link to={`/edit-application/${app.id}`} className="btn-icon btn-edit" title="Edit Application">
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              <button className="btn-icon btn-delete" title="Delete Application" onClick={() => handleDelete(app.id, app.application_id)}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        {hasActiveFilters ? 'No applications match the selected filters' : 'No applications found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ListPagination
              total={filteredApplications.length}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemLabel="application"
            />
            </>
          )}
        </div>
      </div>
      {viewRecordId && (
        <ViewRecordModal title="View Application" onClose={() => setViewRecordId(null)}>
          <EditApplication recordId={viewRecordId} viewOnly />
        </ViewRecordModal>
      )}
    </>
  );
}