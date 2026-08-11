import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faDownload,
  faCheckCircle,
  faBan,
  faTimes,
  faUniversity,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Intakes() {
  const [intakes, setIntakes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [stats, setStats] = useState({
    total_intakes: 0,
    active_intakes: 0,
    inactive_intakes: 0,
    universities_with_intakes: 0
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentIntake, setCurrentIntake] = useState(null);
  const [formData, setFormData] = useState({
    intakeName: '',
    universityId: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [intakeToDelete, setIntakeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchIntakes();
    fetchUniversities();
    fetchCountries();
    fetchStats();
  }, []);

  const fetchIntakes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/intakes`);
      const data = await response.json();
      
      if (data.success) {
        setIntakes(data.intakes);
      } else {
        setError(data.message || 'Failed to fetch intakes');
      }
    } catch (err) {
      console.error('Error fetching intakes:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const response = await fetch(`${API_URL}/universities`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only active universities for the dropdown
        const activeUniversities = data.universities.filter(u => u.status === 'Active');
        setUniversities(activeUniversities);
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_URL}/countries`);
      const data = await response.json();
      
      if (data.success) {
        setCountries(data.countries);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/intakes/stats/overview`);
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
      intakeName: '',
      universityId: '',
      status: 'Active'
    });
    setFormErrors({});
    setCurrentIntake(null);
    setShowModal(true);
  };

  const openEditModal = (intake) => {
    setModalMode('edit');
    setFormData({
      intakeName: intake.intake_name,
      universityId: intake.university_id,
      status: intake.status
    });
    setFormErrors({});
    setCurrentIntake(intake);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      intakeName: '',
      universityId: '',
      status: 'Active'
    });
    setFormErrors({});
    setCurrentIntake(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.intakeName.trim()) {
      errors.intakeName = 'Intake name is required';
    } else if (formData.intakeName.trim().length < 3) {
      errors.intakeName = 'Intake name must be at least 3 characters';
    } else if (formData.intakeName.trim().length > 100) {
      errors.intakeName = 'Intake name must not exceed 100 characters';
    }

    if (!formData.universityId) {
      errors.universityId = 'University is required';
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
        ? `${API_URL}/intakes`
        : `${API_URL}/intakes/${currentIntake.id}`;

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
        fetchIntakes();
        fetchStats();
        alert(data.message);
      } else {
        setError(data.message || `Failed to ${modalMode} intake`);
      }
    } catch (err) {
      console.error(`Error ${modalMode}ing intake:`, err);
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (intake) => {
    setIntakeToDelete(intake);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setIntakeToDelete(null);
  };

  const handleDelete = async () => {
    if (!intakeToDelete) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/intakes/${intakeToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        closeDeleteModal();
        fetchIntakes();
        fetchStats();
        alert(data.message);
      } else {
        setError(data.message || 'Failed to delete intake');
      }
    } catch (err) {
      console.error('Error deleting intake:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setDeleting(false);
    }
  };

  // Get filtered universities based on country selection
  const getFilteredUniversitiesForDropdown = () => {
    return universities;
  };

  const filteredIntakes = intakes.filter(intake => {
    const matchesSearch = 
      intake.intake_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intake.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intake.country_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || intake.status === statusFilter;
    const matchesUniversity = !universityFilter || intake.university_id === parseInt(universityFilter);
    const matchesCountry = !countryFilter || intake.country_id === parseInt(countryFilter);
    
    return matchesSearch && matchesStatus && matchesUniversity && matchesCountry;
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
                <FontAwesomeIcon icon={faCalendarAlt} className="page-icon" />
                Intake Management
              </h1>
            </div>
            <div className="header-right">
              <button className="btn-primary" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                Add Intake
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
                placeholder="Search intakes, universities or countries..." 
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
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
              >
                <option value="">All Universities</option>
                {universities.map(university => (
                  <option key={university.id} value={university.id}>
                    {university.university_name}
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
              <p>Loading intakes...</p>
            </div>
          ) : (
            <>
              <div className="leads-table-container">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Intake Name</th>
                      <th>University</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIntakes.length > 0 ? (
                      filteredIntakes.map((intake) => (
                        <tr key={intake.id}>
                          <td>
                            <strong style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              background: '#E3F2FD',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#1976D2'
                            }}>
                              <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px' }} />
                              {intake.intake_name}
                            </strong>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              <FontAwesomeIcon icon={faUniversity} style={{ marginRight: '6px', color: '#F47B20' }} />
                              {intake.university_name}
                            </span>
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
                              <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '6px', color: '#666' }} />
                              {intake.country_name}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${intake.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              <FontAwesomeIcon 
                                icon={intake.status === 'Active' ? faCheckCircle : faBan} 
                                style={{ marginRight: '5px' }}
                              />
                              {intake.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-icon btn-edit" 
                                title="Edit Intake"
                                onClick={() => openEditModal(intake)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                className="btn-icon btn-delete" 
                                title="Delete Intake"
                                onClick={() => openDeleteModal(intake)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                          No intakes found
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
                {modalMode === 'create' ? 'Add New Intake' : 'Edit Intake'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="intakeName">
                    Intake Name <span style={{color: 'red'}}>*</span>
                  </label>
                  <input
                    type="text"
                    id="intakeName"
                    className={`input-field ${formErrors.intakeName ? 'error' : ''}`}
                    placeholder="e.g., Spring 2026, Summer 2026, Fall 2026"
                    value={formData.intakeName}
                    onChange={(e) => setFormData({...formData, intakeName: e.target.value})}
                  />
                  {formErrors.intakeName && (
                    <span className="error-message">{formErrors.intakeName}</span>
                  )}
                  <small style={{ display: 'block', marginTop: '6px', color: '#666', fontSize: '12px' }}>
                    Examples: Spring 2025, Summer 2025, Fall 2025, Winter 2026
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="universityId">
                    University <span style={{color: 'red'}}>*</span>
                  </label>
                  <select
                    id="universityId"
                    className={`input-field ${formErrors.universityId ? 'error' : ''}`}
                    value={formData.universityId}
                    onChange={(e) => setFormData({...formData, universityId: e.target.value})}
                  >
                    <option value="">Select a university</option>
                    {getFilteredUniversitiesForDropdown().map(university => (
                      <option key={university.id} value={university.id}>
                        {university.university_name} ({university.country_name})
                      </option>
                    ))}
                  </select>
                  {formErrors.universityId && (
                    <span className="error-message">{formErrors.universityId}</span>
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
                  {submitting ? 'Saving...' : (modalMode === 'create' ? 'Add Intake' : 'Update Intake')}
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
                Are you sure you want to delete <strong>{intakeToDelete?.intake_name}</strong>?
              </p>
              <p style={{ marginBottom: '8px', color: '#666' }}>
                University: <strong>{intakeToDelete?.university_name}</strong>
              </p>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Country: <strong>{intakeToDelete?.country_name}</strong>
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
                {deleting ? 'Deleting...' : 'Delete Intake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}