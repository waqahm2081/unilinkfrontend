import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/counselors.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie, faPlus, faEdit, faUsers, faSearch,
  faChevronRight, faFileAlt, faCircle
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Counselors() {
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [totalApplications, setTotalApplications] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCounselors();
        fetchTotalApplications();
    }, []);

    const fetchCounselors = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/counselors`);
            const data = await response.json();
            if (data.success) {
                setCounselors(data.counselors);
            } else {
                setError(data.message || 'Failed to fetch counselors');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTotalApplications = async () => {
        try {
            const response = await fetch(`${API_URL}/applications`);
            const data = await response.json();
            if (data.success) {
                setTotalApplications(data.total || data.applications?.length || 0);
            }
        } catch (err) {
            // silently fail
        }
    };

    const filteredCounselors = counselors.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.counselor_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCounselors = counselors.filter(c => c.status === 'Active').length;
    const totalStudents = counselors.reduce((sum, c) => sum + (c.number_of_students || 0), 0);

    const handleCounselorClick = (counselorId) => {
        navigate(`/students?counselorId=${counselorId}`);
    };

    return (
        <>
            <Sidebar />
            <div className="main-content maincounselorpage" id="mainContent">
                <Header />
                <div className="counselors-container">

                    {/* Header */}
                    <div className="counselors-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faUserTie} className="page-icon" />
                                Counselors Management
                            </h1>
                        </div>
                        <div className="header-right">
                            <Link to="/create-counselor" className="btn-primary">
                                <FontAwesomeIcon icon={faPlus} />
                                Add Counselor
                            </Link>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: '#E3F2FD' }}>
                                <FontAwesomeIcon icon={faUserTie} style={{ color: '#1976D2' }} />
                            </div>
                            <div className="stat-content">
                                <h3>Total Counselors</h3>
                                <p className="stat-number">{counselors.length}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: '#E8F5E9' }}>
                                <FontAwesomeIcon icon={faUsers} style={{ color: '#388E3C' }} />
                            </div>
                            <div className="stat-content">
                                <h3>Total Active Students</h3>
                                <p className="stat-number">{totalStudents}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: '#FFF3E0' }}>
                                <FontAwesomeIcon icon={faFileAlt} style={{ color: '#F57C00' }} />
                            </div>
                            <div className="stat-content">
                                <h3>Total Applications Submitted</h3>
                                <p className="stat-number">{totalApplications}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
                            {error}
                        </div>
                    )}

                    {/* Search */}
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                        <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search counselors by name, email, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px', borderRadius: '10px', border: '1px solid #e5e7eb', height: '42px' }}
                        />
                    </div>

                    {/* Counselor Cards */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <p style={{ color: '#6b7280' }}>Loading counselors...</p>
                        </div>
                    ) : filteredCounselors.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                            No counselors found
                        </div>
                    ) : (
                        <div className="counselor-cards-grid">
                            {filteredCounselors.map((counselor) => (
                                <div key={counselor.id} className="counselor-card">
                                    {/* Card Header - Clickable area */}
                                    <div
                                        className="counselor-card-body"
                                        onClick={() => handleCounselorClick(counselor.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="counselor-card-avatar">
                                            {counselor.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="counselor-card-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h3 className="counselor-card-name">{counselor.name}</h3>
                                                <span style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    backgroundColor: counselor.status === 'Active' ? '#22c55e' : '#ef4444',
                                                    display: 'inline-block', flexShrink: 0
                                                }} title={counselor.status} />
                                            </div>
                                            <div className="counselor-card-id">{counselor.counselor_id}</div>
                                            <div className="counselor-card-email">{counselor.email}</div>
                                        </div>
                                    </div>

                                    {/* Student Count + Actions Footer */}
                                    <div className="counselor-card-footer">
                                        <div
                                            className="counselor-student-badge"
                                            onClick={() => handleCounselorClick(counselor.id)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to view assigned students"
                                        >
                                            <FontAwesomeIcon icon={faUsers} style={{ fontSize: '12px' }} />
                                            <span>{counselor.number_of_students || 0} Active Student{counselor.number_of_students !== 1 ? 's' : ''}</span>
                                            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '11px', marginLeft: 'auto' }} />
                                        </div>

                                        <Link
                                            to={`/edit-counselor/${counselor.id}`}
                                            className="counselor-edit-btn"
                                            title="Edit Counselor"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}