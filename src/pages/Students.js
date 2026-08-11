import React, { useState, useEffect, useRef } from 'react'
import '../styles/dashboard.css'
import '../styles/students.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faPlus, faEdit, faTrash, faSearch, faChevronDown, faTimes, faArrowLeft, faUserTie,
  faChevronLeft, faChevronRight, faKey, faCheckCircle, faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const PAGE_SIZE = 15;

const getStatusBadgeStyle = (status) => {
    const styles = {
        'Active':           { background: '#dcfce7', color: '#166534' },
        'Inactive':         { background: '#fee2e2', color: '#991b1b' },
        'Registered':       { background: '#dbeafe', color: '#1e40af' },
        'App in Progress':  { background: '#fef9c3', color: '#854d0e' },
        'Pending':          { background: '#f3f4f6', color: '#374151' },
        'Offer Received':   { background: '#d1fae5', color: '#065f46' },
        'Offer Refused':    { background: '#fee2e2', color: '#7f1d1d' },
        'Visa Applied':     { background: '#ede9fe', color: '#4c1d95' },
        'Visa Approved':    { background: '#bbf7d0', color: '#14532d' },
        'Visa Rejected':    { background: '#fecaca', color: '#7f1d1d' },
    };
    return styles[status] || { background: '#f3f4f6', color: '#374151' };
};

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [columnFilters, setColumnFilters] = useState({
        fullName: [], country: [], course: [], status: []
    });
    const [filterSearch, setFilterSearch] = useState({
        fullName: '', country: '', course: '', status: ''
    });
    const [counselorInfo, setCounselorInfo] = useState(null);

    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentialsLoading, setCredentialsLoading] = useState(false);
    const [credentialsData, setCredentialsData] = useState(null);
    const [credentialsError, setCredentialsError] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const counselorId = searchParams.get('counselorId');

    useEffect(() => {
        if (counselorId) {
            fetchStudentsByCounselor(counselorId);
        } else {
            fetchStudents();
        }
    }, [counselorId]);

    // Reset to page 1 whenever filters or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, columnFilters]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.filter-dropdown-container')) setActiveFilter(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/students`);
            const data = await response.json();
            if (data.success) setStudents(data.students);
            else setError(data.message || 'Failed to fetch students');
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsByCounselor = async (cId) => {
        setLoading(true);
        setError('');
        try {
            const counselorRes = await fetch(`${API_URL}/counselors/${cId}`);
            const counselorData = await counselorRes.json();
            if (counselorData.success) {
                setCounselorInfo(counselorData.counselor);
                const assignedStudents = counselorData.assignedStudents || [];
                const studentDetails = await Promise.all(
                    assignedStudents.map(async (s) => {
                        try {
                            const res = await fetch(`${API_URL}/students/${s.id}`);
                            const d = await res.json();
                            return d.success ? d.student : s;
                        } catch {
                            return s;
                        }
                    })
                );
                setStudents(studentDetails);
            } else {
                setError('Failed to load counselor data');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to delete ${studentName}? This will delete all associated data.`)) return;
        try {
            const response = await fetch(`${API_URL}/students/${studentId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('Student deleted successfully');
                counselorId ? fetchStudentsByCounselor(counselorId) : fetchStudents();
            } else alert(data.message || 'Failed to delete student');
        } catch (err) {
            alert('Network error. Please try again.');
        }
    };

    const handleShowCredentials = async (studentId) => {
        setCredentialsLoading(true);
        setCredentialsError('');
        setCredentialsData(null);
        setShowCredentialsModal(true);
        try {
            const response = await fetch(`${API_URL}/students/${studentId}/credentials`);
            const data = await response.json();
            if (data.success) {
                setCredentialsData(data.credentials);
            } else {
                setCredentialsError(data.message || 'Failed to load credentials');
            }
        } catch (err) {
            setCredentialsError('Network error. Please try again.');
        } finally {
            setCredentialsLoading(false);
        }
    };

    const getFullName = (student) => {
        return [student.name, student.middle_name, student.surname].filter(Boolean).join(' ');
    };

    const getUniqueValues = (column) => {
        const values = new Set();
        students.forEach(s => {
            let value;
            switch (column) {
                case 'fullName': value = getFullName(s); break;
                case 'country': value = s.country; break;
                case 'course': value = s.course || null; break;
                case 'status': value = s.status; break;
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
        setColumnFilters({ fullName: [], country: [], course: [], status: [] });
        setFilterSearch({ fullName: '', country: '', course: '', status: '' });
        setSearchTerm('');
    };

    const filteredStudents = students.filter(s => {
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const name = getFullName(s).toLowerCase();
            if (!name.includes(term) && !s.email?.toLowerCase().includes(term) &&
                !s.mobile?.includes(term) && !s.student_id?.toLowerCase().includes(term)) return false;
        }
        if (columnFilters.fullName.length > 0 && !columnFilters.fullName.includes(getFullName(s))) return false;
        if (columnFilters.country.length > 0 && !columnFilters.country.includes(s.country)) return false;
        if (columnFilters.course.length > 0 && !columnFilters.course.includes(s.course)) return false;
        if (columnFilters.status.length > 0 && !columnFilters.status.includes(s.status)) return false;
        return true;
    });

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedStudents = filteredStudents.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE
    );

    const goToPage = (page) => {
        const p = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(p);
    };

    // Build page number list with ellipsis
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [];
        if (safeCurrentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (safeCurrentPage >= totalPages - 3) {
            pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
        }
        return pages;
    };

    const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim();

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
                ? rect.bottom + 8 : rect.top - dropdownHeight - 8;
            let left = rect.left;
            const dropdownWidth = 280;
            if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 20;
            setDropdownPosition({ top, left });
            setActiveFilter(column);
        };

        return (
            <div className="filter-dropdown-container">
                <button ref={triggerRef} className={`filter-trigger ${hasFilters ? 'has-filters' : ''}`} onClick={handleToggle}>
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
                                    <input type="checkbox" checked={columnFilters[column].includes(value)} onChange={() => toggleFilterValue(column, value)} />
                                    <span className="filter-label">{value}</span>
                                </label>
                            )) : <div className="no-results">No results found</div>}
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
                <div className="students-container">

                    {/* Back banner when filtered by counselor */}
                    {counselorId && counselorInfo && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            background: '#FFF7ED', border: '1px solid #FED7AA',
                            borderRadius: '12px', padding: '14px 18px', marginBottom: '20px'
                        }}>
                            <button
                                onClick={() => navigate('/counselors')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#F47B20', color: '#fff', border: 'none',
                                    padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
                                    fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Back
                            </button>
                            <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20', fontSize: '18px' }} />
                            <div>
                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                                    Students assigned to: {counselorInfo.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {counselorInfo.counselor_id} • {counselorInfo.email}
                                </div>
                            </div>
                            <div style={{
                                marginLeft: 'auto', background: '#F47B20', color: '#fff',
                                borderRadius: '20px', padding: '4px 14px', fontSize: '13px', fontWeight: '700'
                            }}>
                                {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    )}

                    <div className="students-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faUsers} className="page-icon" />
                                {counselorId ? 'Assigned Students' : 'Students Management'}
                            </h1>
                        </div>
                        <div className="header-right">
                            {hasActiveFilters && (
                                <button className="btn-clear-all-filters" onClick={clearAllFilters}>
                                    <FontAwesomeIcon icon={faTimes} /> Clear All Filters
                                </button>
                            )}
                            {!counselorId && (
                                <Link to="/create-student" className="btn-primary">
                                    <FontAwesomeIcon icon={faPlus} /> Add New Student
                                </Link>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search students by name, email, mobile or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px', borderRadius: '10px', border: '1px solid #e5e7eb', height: '42px' }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading students...</p></div>
                    ) : (
                        <>
                            <div className="students-table-container">
                                <table className="students-table">
                                    <thead>
                                        <tr>
                                            <th>Registered ID</th>
                                            <th><FilterDropdown column="fullName" label="Full Name" /></th>
                                            <th>Contact No</th>
                                            <th>Email</th>
                                            <th><FilterDropdown column="country" label="Country" /></th>
                                            <th><FilterDropdown column="course" label="Course" /></th>
                                            <th><FilterDropdown column="status" label="Status" /></th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedStudents.length > 0 ? (
                                            paginatedStudents.map((student) => {
                                                const statusStyle = getStatusBadgeStyle(student.status);
                                                return (
                                                    <tr key={student.id}>
                                                        <td><span className="student-id">{student.student_id}</span></td>
                                                        <td><strong>{getFullName(student)}</strong></td>
                                                        <td>{student.mobile || '-'}</td>
                                                        <td>{student.email}</td>
                                                        <td>{student.country || '-'}</td>
                                                        <td>{student.course || '-'}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: '2px 10px', borderRadius: '20px',
                                                                fontSize: '11px', fontWeight: '600', ...statusStyle
                                                            }}>
                                                                {student.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="btn-icon btn-credentials"
                                                                    title="View Login Credentials"
                                                                    onClick={() => handleShowCredentials(student.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faKey} />
                                                                </button>
                                                                <Link to={`/edit-student/${student.id}`} className="btn-icon btn-edit" title="Edit Student">
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </Link>
                                                                <button className="btn-icon btn-delete" title="Delete Student" onClick={() => handleDelete(student.id, student.name)}>
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                                    {hasActiveFilters
                                                        ? 'No students match the selected filters'
                                                        : counselorId
                                                            ? 'No students assigned to this counselor yet'
                                                            : 'No students found'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredStudents.length > 0 && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: '20px', flexWrap: 'wrap', gap: '12px'
                                }}>
                                    {/* Results info */}
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                        Showing <strong>{(safeCurrentPage - 1) * PAGE_SIZE + 1}</strong>–<strong>{Math.min(safeCurrentPage * PAGE_SIZE, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> student{filteredStudents.length !== 1 ? 's' : ''}
                                    </div>

                                    {/* Page controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {/* Previous */}
                                        <button
                                            onClick={() => goToPage(safeCurrentPage - 1)}
                                            disabled={safeCurrentPage === 1}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '7px 14px', borderRadius: '8px', border: '1px solid #e5e7eb',
                                                background: safeCurrentPage === 1 ? '#f9fafb' : 'white',
                                                color: safeCurrentPage === 1 ? '#9ca3af' : '#374151',
                                                cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '13px', fontWeight: '500', transition: 'all 0.15s'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '11px' }} />
                                            Previous
                                        </button>

                                        {/* Page numbers */}
                                        {getPageNumbers().map((page, idx) =>
                                            page === '...'
                                                ? (
                                                    <span key={`ellipsis-${idx}`} style={{
                                                        padding: '7px 4px', color: '#9ca3af', fontSize: '13px', userSelect: 'none'
                                                    }}>
                                                        …
                                                    </span>
                                                )
                                                : (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        style={{
                                                            width: '36px', height: '36px', borderRadius: '8px',
                                                            border: safeCurrentPage === page ? '2px solid #F47B20' : '1px solid #e5e7eb',
                                                            background: safeCurrentPage === page ? '#F47B20' : 'white',
                                                            color: safeCurrentPage === page ? 'white' : '#374151',
                                                            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                        )}

                                        {/* Next */}
                                        <button
                                            onClick={() => goToPage(safeCurrentPage + 1)}
                                            disabled={safeCurrentPage === totalPages}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '7px 14px', borderRadius: '8px', border: '1px solid #e5e7eb',
                                                background: safeCurrentPage === totalPages ? '#f9fafb' : 'white',
                                                color: safeCurrentPage === totalPages ? '#9ca3af' : '#374151',
                                                cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                                                fontSize: '13px', fontWeight: '500', transition: 'all 0.15s'
                                            }}
                                        >
                                            Next
                                            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '11px' }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showCredentialsModal && (
                <>
                    <div className="modal-backdrop show" onClick={() => !credentialsLoading && setShowCredentialsModal(false)}></div>
                    <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={faKey} style={{ marginRight: '10px', color: '#F47B20' }} />
                                        Student Login Credentials
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close-modal"
                                        onClick={() => setShowCredentialsModal(false)}
                                        disabled={credentialsLoading}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {credentialsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Loading credentials…</div>
                                    ) : credentialsError ? (
                                        <div style={{
                                            background: '#fef2f2', color: '#991b1b', padding: '16px',
                                            borderRadius: '8px', border: '1px solid #fecaca', fontSize: '14px'
                                        }}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
                                            {credentialsError}
                                        </div>
                                    ) : credentialsData && (
                                        <>
                                            <p style={{ fontSize: '15px', marginBottom: '16px' }}>
                                                Login details for <strong>{credentialsData.studentName}</strong>
                                                {credentialsData.studentRefId && (
                                                    <span style={{ color: '#6b7280' }}> ({credentialsData.studentRefId})</span>
                                                )}
                                            </p>
                                            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #fbbf24' }}>
                                                <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#92400e', fontSize: '14px' }}>
                                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
                                                    Share these credentials securely with the student
                                                </p>
                                                <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Email:</label>
                                                        <div style={{ fontFamily: 'monospace', fontSize: '14px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                                                            {credentialsData.email}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Password:</label>
                                                        <div style={{ fontFamily: 'monospace', fontSize: '14px', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', fontWeight: 'bold', color: '#F47B20' }}>
                                                            {credentialsData.password}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => { setShowCredentialsModal(false); setCredentialsData(null); setCredentialsError(''); }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}