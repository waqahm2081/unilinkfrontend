import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/logs.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function VisitorLogs() {
    const [visitorLogs, setVisitorLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [filterVisitorType, setFilterVisitorType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [stats, setStats] = useState({
        totalVisitors: 0,
        todayVisitors: 0,
        currentlyInOffice: 0
    });

    useEffect(() => {
        fetchVisitorLogs();
    }, [filterVisitorType, filterStatus, searchQuery]);

    const fetchVisitorLogs = async () => {
        setLoading(true);
        setError('');
        
        try {
            const params = new URLSearchParams();
            if (filterVisitorType) params.append('visitorType', filterVisitorType);
            if (filterStatus) params.append('status', filterStatus);
            if (searchQuery) params.append('searchQuery', searchQuery);
            
            const response = await fetch(`${API_URL}/visitor-logs?${params.toString()}`);
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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

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
                            <Link to="/add-log" className="btn-primary">
                                <FontAwesomeIcon icon={faPlus} />
                                Add New Log
                            </Link>
                        </div>
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

                    <div className="logs-filters">
                        <div className="search-box">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Search by name, contact, or visitor ID..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <select 
                                className="input-field"
                                value={filterVisitorType}
                                onChange={(e) => setFilterVisitorType(e.target.value)}
                            >
                                <option value="">All Visitor Types</option>
                                <option value="Student">Student</option>
                                <option value="Parent">Parent</option>
                                <option value="Counselor">Counselor</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Official">Official</option>
                                <option value="Guest">Guest</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <select 
                                className="input-field"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Loading visitor logs...</p>
                        </div>
                    ) : (
                        <>
                            <div className="logs-table-container">
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th>Log ID</th>
                                            <th>Visitor Name</th>
                                            <th>Visitor Type</th>
                                            <th>Contact</th>
                                            <th>Visit Date</th>
                                            <th>Time In</th>
                                            <th>Time Out</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visitorLogs.length > 0 ? (
                                            visitorLogs.map((log) => (
                                                <tr key={log.id}>
                                                    <td>
                                                        <span className="log-id">{log.log_id}</span>
                                                    </td>
                                                    <td>
                                                        <div className="visitor-info">
                                                            <strong>{log.visitor_name}</strong>
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
                                                    No visitor logs found
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
                                    <button className="page-number">4</button>
                                </div>
                                <button className="btn-secondary">Next</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}