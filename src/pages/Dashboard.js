import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faUserGraduate, faFileAlt, faPassport,
  faList, faEdit, faTrash,
  faUserTie, faPhone,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const getStatusStyle = (status) => {
  const styles = {
    'In Progress': { background: '#ffedd5', color: '#9a3412' },
    'Pending':   { background: '#fef9c3', color: '#854d0e' },
    'Approved':  { background: '#dcfce7', color: '#166534' },
    'Accepted':  { background: '#dbeafe', color: '#1e40af' },
    'Rejected':  { background: '#fee2e2', color: '#991b1b' },
    'Withdrawn': { background: '#f3e8ff', color: '#6b21a8' },
    'Closed':    { background: '#f3f4f6', color: '#374151' },
  };
  return styles[status] || { background: '#f3f4f6', color: '#374151' };
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    assignedLeads: 0,
    totalStudents: 0,
    activeApplications: 0,
    pendingVisas: 0,
    approvedVisas: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/dashboard/recent-applications`, { headers })
      ]);
      const statsData = await statsRes.json();
      const appsData = await appsRes.json();
      if (statsData.success) setStats(statsData.stats);
      if (appsData.success) setRecentApplications(appsData.applications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/applications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecentApplications(prev => prev.filter(app => app.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="dashboard-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard Overview</h1>
              <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
            </div>
          </div>

          {/* Stats Row 1 — Leads (excluding registered students) */}
          <div className="row g-4 mb-4">
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-primary">
                <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.totalLeads ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Total Leads</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-danger">
                <div className="stat-icon"><FontAwesomeIcon icon={faPhone} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.newLeads ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">New Leads</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-warning" style={{ '--card-color': '#F47B20' }}>
                <div className="stat-icon"><FontAwesomeIcon icon={faUserTie} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.assignedLeads ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Leads Assigned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row 2 */}
          <div className="row g-4 mb-4">
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-success">
                <div className="stat-icon"><FontAwesomeIcon icon={faUserGraduate} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.totalStudents ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Total Students Registered</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-info">
                <div className="stat-icon"><FontAwesomeIcon icon={faFileAlt} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.activeApplications ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Active Applications</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-purple">
                <div className="stat-icon"><FontAwesomeIcon icon={faPassport} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.approvedVisas ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Total Visa Approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="row g-4">
            <div className="col-12">
              <div className="chart-card">
                <div className="chart-header">
                  <h5 className="chart-title">
                    <FontAwesomeIcon icon={faList} className="me-2" />
                    Recent Applications
                  </h5>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Register ID</th>
                        <th>Country</th>
                        <th>Program</th>
                        <th>Counselor Assigned</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                            Loading...
                          </td>
                        </tr>
                      ) : recentApplications.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">
                            No applications found
                          </td>
                        </tr>
                      ) : (
                        recentApplications.map(app => {
                          const statusStyle = getStatusStyle(app.application_status);
                          return (
                            <tr key={app.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.student_name)}&background=random`}
                                    className="table-avatar me-2"
                                    alt={app.student_name}
                                  />
                                  <Link to={`/edit-application/${app.id}`} className="table-name-link">
                                    {app.student_name}
                                  </Link>
                                </div>
                              </td>
                              <td>
                                <span className="fw-semibold" style={{ color: '#F47B20' }}>
                                  {app.student_number || '-'}
                                </span>
                              </td>
                              <td>{app.country_name}</td>
                              <td>{app.program || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>}</td>
                              <td>
                                {app.counselor_names
                                  ? <span style={{ fontSize: '13px', fontWeight: '500' }}>{app.counselor_names}</span>
                                  : <span style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>Not Assigned</span>
                                }
                              </td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...statusStyle }}>
                                  {app.application_status}
                                </span>
                              </td>
                              <td>{formatDate(app.created_at)}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Link to={`/edit-application/${app.id}`} className="btn btn-sm btn-outline-primary" title="Edit">
                                    <FontAwesomeIcon icon={faEdit} />
                                  </Link>
                                  {deleteConfirm === app.id ? (
                                    <>
                                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(app.id)} title="Confirm Delete">✓</button>
                                      <button className="btn btn-sm btn-secondary" onClick={() => setDeleteConfirm(null)} title="Cancel">✕</button>
                                    </>
                                  ) : (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm(app.id)} title="Delete">
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}