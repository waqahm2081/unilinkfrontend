import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUniversity,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faDownload,
  faCheckCircle,
  faBan,
  faTimes,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Universities() {
  const [universities, setUniversities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [stats, setStats] = useState({
    total_universities: 0,
    active_universities: 0,
    inactive_universities: 0,
    countries_with_universities: 0
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentUniversity, setCurrentUniversity] = useState(null);
  const [formData, setFormData] = useState({
    universityName: '',
    countryId: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [universityToDelete, setUniversityToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUniversities();
    fetchCountries();
    fetchStats();
  }, []);

  const fetchUniversities = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/universities`);
      const data = await response.json();
      
      if (data.success) {
        setUniversities(data.universities);
      } else {
        setError(data.message || 'Failed to fetch universities');
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_URL}/countries`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only active countries for the dropdown
        const activeCountries = data.countries.filter(c => c.status === 'Active');
        setCountries(activeCountries);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/universities/stats/overview`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      universityName: '',
      countryId: '',
      status: 'Active'
    });
    setFormErrors({});
    setCurrentUniversity(null);
    setShowModal(true);
  };

  const openEditModal = (university) => {
    setModalMode('edit');
    setFormData({
      universityName: university.university_name,
      countryId: university.country_id,
      status: university.status
    });
    setFormErrors({});
    setCurrentUniversity(university);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      universityName: '',
      countryId: '',
      status: 'Active'
    });
    setFormErrors({});
    setCurrentUniversity(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.universityName.trim()) {
      errors.universityName = 'University name is required';
    } else if (formData.universityName.trim().length < 3) {
      errors.universityName = 'University name must be at least 3 characters';
    } else if (formData.universityName.trim().length > 200) {
      errors.universityName = 'University name must not exceed 200 characters';
    }

    if (!formData.countryId) {
      errors.countryId = 'Country is required';
    }

    if (!formData.status) {
      errors.status = 'Status is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = modalMode === 'create' 
        ? `${API_URL}/universities`
        : `${API_URL}/universities/${currentUniversity.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        closeModal();
        fetchUniversities();
        fetchStats();
        alert(data.message);
      } else {
        setError(data.message || `Failed to ${modalMode} university`);
      }
    } catch (err) {
      console.error(`Error ${modalMode}ing university:`, err);
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (university) => {
    setUniversityToDelete(university);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUniversityToDelete(null);
  };

  const handleDelete = async () => {
    if (!universityToDelete) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/universities/${universityToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        closeDeleteModal();
        fetchUniversities();
        fetchStats();
        alert(data.message);
      } else {
        setError(data.message || 'Failed to delete university');
      }
    } catch (err) {
      console.error('Error deleting university:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUniversities = universities.filter(university => {
    const matchesSearch = university.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          university.country_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || university.status === statusFilter;
    const matchesCountry = !countryFilter || university.country_id === parseInt(countryFilter);
    return matchesSearch && matchesStatus && matchesCountry;
  });

  return (
    <>
      <Sidebar />

      <div className="main-content" id="mainContent">
        <Header />

        <div className="leads-container">
          <div className="leads-header">
            <div className="header-left">
              <h1>
                <FontAwesomeIcon icon={faUniversity} className="page-icon" />
                University Management
              </h1>
            </div>
            <div className="header-right">
              <button className="btn-primary" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                Add University
              </button>
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

          <div className="leads-filters">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search universities or countries..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select 
                className="input-field"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>
                    {country.country_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select 
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading universities...</p>
            </div>
          ) : (
            <>
              <div className="leads-table-container">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>University Name</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUniversities.length > 0 ? (
                      filteredUniversities.map((university) => (
                        <tr key={university.id}>
                          <td>
                            <strong>{university.university_name}</strong>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              background: '#F5F5F5',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '6px', color: '#F47B20' }} />
                              {university.country_name}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${university.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              <FontAwesomeIcon 
                                icon={university.status === 'Active' ? faCheckCircle : faBan} 
                                style={{ marginRight: '5px' }}
                              />
                              {university.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-icon btn-edit" 
                                title="Edit University"
                                onClick={() => openEditModal(university)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                className="btn-icon btn-delete" 
                                title="Delete University"
                                onClick={() => openDeleteModal(university)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                          No universities found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={modalMode === 'create' ? faPlus : faEdit} style={{ marginRight: '10px' }} />
                {modalMode === 'create' ? 'Add New University' : 'Edit University'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="universityName">
                    University Name <span style={{color: 'red'}}>*</span>
                  </label>
                  <input
                    type="text"
                    id="universityName"
                    className={`input-field ${formErrors.universityName ? 'error' : ''}`}
                    placeholder="Enter university name"
                    value={formData.universityName}
                    onChange={(e) => setFormData({...formData, universityName: e.target.value})}
                  />
                  {formErrors.universityName && (
                    <span className="error-message">{formErrors.universityName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="countryId">
                    Country <span style={{color: 'red'}}>*</span>
                  </label>
                  <select
                    id="countryId"
                    className={`input-field ${formErrors.countryId ? 'error' : ''}`}
                    value={formData.countryId}
                    onChange={(e) => setFormData({...formData, countryId: e.target.value})}
                  >
                    <option value="">Select a country</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.country_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.countryId && (
                    <span className="error-message">{formErrors.countryId}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Status <span style={{color: 'red'}}>*</span>
                  </label>
                  <select
                    id="status"
                    className={`input-field ${formErrors.status ? 'error' : ''}`}
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {formErrors.status && (
                    <span className="error-message">{formErrors.status}</span>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (modalMode === 'create' ? 'Add University' : 'Update University')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faTrash} style={{ marginRight: '10px', color: '#F44336' }} />
                Confirm Delete
              </h2>
              <button className="modal-close" onClick={closeDeleteModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '10px' }}>
                Are you sure you want to delete <strong>{universityToDelete?.university_name}</strong>?
              </p>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Country: <strong>{universityToDelete?.country_name}</strong>
              </p>
              <p style={{ color: '#F44336', fontSize: '14px' }}>
                This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleDelete}
                disabled={deleting}
                style={{ backgroundColor: '#F44336' }}
              >
                {deleting ? 'Deleting...' : 'Delete University'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}