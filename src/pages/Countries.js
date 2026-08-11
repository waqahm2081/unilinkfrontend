import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGlobe, faPlus, faEdit, faTrash, faSearch,
  faCheckCircle, faBan, faTimes, faConciergeBell,
  faList
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

/** Nest flat country_services rows into { ...parent, sub_services: [] } sets */
const nestCountryServices = (services) => {
  const list = Array.isArray(services) ? services : [];
  if (list.some(s => Array.isArray(s.sub_services))) {
    return list.map(s => ({
      ...s,
      sub_services: Array.isArray(s.sub_services) ? s.sub_services : []
    }));
  }

  const parents = list.filter(s => s.parent_id == null || s.parent_id === '' || Number(s.parent_id) === 0);
  const children = list.filter(s => s.parent_id != null && s.parent_id !== '' && Number(s.parent_id) !== 0);

  if (children.length === 0) {
    return parents.map(p => ({ ...p, sub_services: [] }));
  }

  return parents
    .map(parent => ({
      ...parent,
      sub_services: children
        .filter(c => Number(c.parent_id) === Number(parent.id))
        .sort((a, b) => (Number(a.display_order) - Number(b.display_order)) || (a.id - b.id))
    }))
    .sort((a, b) => (Number(a.display_order) - Number(b.display_order)) || (a.id - b.id));
};

export default function Countries() {
  const [activeTab, setActiveTab] = useState('countries'); // 'countries' | 'services'
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ total_countries: 0, active_countries: 0, inactive_countries: 0 });

  // Country modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentCountry, setCurrentCountry] = useState(null);
  const [formData, setFormData] = useState({ countryName: '', status: 'Active' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Services state ----
  const [selectedCountryForServices, setSelectedCountryForServices] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState('create');
  const [currentService, setCurrentService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    description: '',
    displayOrder: '99',
    parentId: '',
    subServicesText: ''
  });
  const [serviceFormErrors, setServiceFormErrors] = useState({});
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [showServiceDeleteModal, setShowServiceDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [serviceDeleting, setServiceDeleting] = useState(false);

  useEffect(() => { fetchCountries(); fetchStats(); }, []);

  const fetchCountries = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      if (data.success) setCountries(data.countries);
      else setError(data.message || 'Failed to fetch countries');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/countries/stats/overview`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {}
  };

  const fetchServices = async (countryId) => {
    setServicesLoading(true);
    try {
      const res = await fetch(`${API_URL}/countries/${countryId}/services`);
      const data = await res.json();
      if (data.success) {
        // Prefer flat list when present so we can nest reliably even if API is old
        const raw = Array.isArray(data.flatServices) && data.flatServices.length
          ? data.flatServices
          : (data.services || []);
        setServices(nestCountryServices(raw));
      }
    } catch {}
    finally { setServicesLoading(false); }
  };

  const openServicesTab = (country) => {
    setSelectedCountryForServices(country);
    setActiveTab('services');
    fetchServices(country.id);
  };

  // Country CRUD
  const openCreateModal = () => {
    setModalMode('create'); setFormData({ countryName: '', status: 'Active' }); setFormErrors({});
    setCurrentCountry(null); setShowModal(true);
  };
  const openEditModal = (country) => {
    setModalMode('edit'); setFormData({ countryName: country.country_name, status: country.status });
    setFormErrors({}); setCurrentCountry(country); setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false); setFormData({ countryName: '', status: 'Active' });
    setFormErrors({}); setCurrentCountry(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.countryName.trim()) errors.countryName = 'Country name is required';
    else if (formData.countryName.trim().length < 2) errors.countryName = 'At least 2 characters';
    else if (formData.countryName.trim().length > 100) errors.countryName = 'Max 100 characters';
    if (!formData.status) errors.status = 'Status is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true); setError('');
    try {
      const url = modalMode === 'create' ? `${API_URL}/countries` : `${API_URL}/countries/${currentCountry.id}`;
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) { closeModal(); fetchCountries(); fetchStats(); }
      else setError(data.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!countryToDelete) return;
    setDeleting(true); setError('');
    try {
      const res = await fetch(`${API_URL}/countries/${countryToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setShowDeleteModal(false); setCountryToDelete(null); fetchCountries(); fetchStats(); }
      else setError(data.message || 'Failed to delete');
    } catch { setError('Network error.'); }
    finally { setDeleting(false); }
  };

  // Service CRUD
  const openCreateService = (parentId = '') => {
    setServiceModalMode('create');
    setServiceForm({
      serviceName: '',
      description: '',
      displayOrder: String(parentId ? 1 : services.length + 1),
      parentId: parentId ? String(parentId) : '',
      subServicesText: ''
    });
    setServiceFormErrors({}); setCurrentService(null); setShowServiceModal(true);
  };

  const openEditService = (svc, parentId = null) => {
    setServiceModalMode('edit');
    setServiceForm({
      serviceName: svc.service_name,
      description: svc.description || '',
      displayOrder: String(svc.display_order),
      parentId: parentId != null ? String(parentId) : (svc.parent_id ? String(svc.parent_id) : ''),
      subServicesText: ''
    });
    setServiceFormErrors({}); setCurrentService(svc); setShowServiceModal(true);
  };

  const validateService = () => {
    const errs = {};
    if (!serviceForm.serviceName.trim()) errs.serviceName = 'Service name is required';
    setServiceFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseSubServices = (text) =>
    (text || '')
      .split('\n')
      .map(line => line.replace(/^[\s•\-\*\d.)]+/, '').trim())
      .filter(Boolean);

  const handleServiceSubmit = async () => {
    if (!validateService()) return;
    setServiceSubmitting(true); setError('');
    try {
      const countryId = selectedCountryForServices.id;
      const isCreatingSet = serviceModalMode === 'create' && !serviceForm.parentId;
      const payload = {
        serviceName: serviceForm.serviceName,
        description: serviceForm.description,
        displayOrder: parseInt(serviceForm.displayOrder) || 99,
        parentId: serviceForm.parentId ? parseInt(serviceForm.parentId, 10) : null
      };

      const url = serviceModalMode === 'create'
        ? `${API_URL}/countries/${countryId}/services`
        : `${API_URL}/countries/${countryId}/services/${currentService.id}`;
      const res = await fetch(url, {
        method: serviceModalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed');
        return;
      }

      // When creating a main set, optionally create bullet sub-services in one go
      if (isCreatingSet && data.serviceId) {
        const subs = parseSubServices(serviceForm.subServicesText);
        for (let i = 0; i < subs.length; i++) {
          await fetch(`${API_URL}/countries/${countryId}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceName: subs[i],
              displayOrder: i + 1,
              parentId: data.serviceId
            })
          });
        }
      }

      setShowServiceModal(false);
      fetchServices(countryId);
    } catch { setError('Network error.'); }
    finally { setServiceSubmitting(false); }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete || !selectedCountryForServices) return;
    setServiceDeleting(true); setError('');
    try {
      const res = await fetch(`${API_URL}/countries/${selectedCountryForServices.id}/services/${serviceToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setShowServiceDeleteModal(false); setServiceToDelete(null); fetchServices(selectedCountryForServices.id); }
      else setError(data.message);
    } catch { setError('Network error.'); }
    finally { setServiceDeleting(false); }
  };

  const filteredCountries = countries.filter(c => {
    const matchesSearch = c.country_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isCreatingSub = serviceModalMode === 'create' && !!serviceForm.parentId;
  const isEditingSub = serviceModalMode === 'edit' && !!serviceForm.parentId;
  const parentName = serviceForm.parentId
    ? services.find(s => s.id === parseInt(serviceForm.parentId, 10))?.service_name
    : null;

  const tabStyle = (tab) => ({
    padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    border: 'none', background: 'none', borderBottom: `3px solid ${activeTab === tab ? '#F47B20' : 'transparent'}`,
    color: activeTab === tab ? '#F47B20' : '#666', transition: 'all 0.2s'
  });

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="leads-container">

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>
              <button style={tabStyle('countries')} onClick={() => setActiveTab('countries')}>
                <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '6px' }} /> Countries
              </button>
              {selectedCountryForServices && (
                <button style={tabStyle('services')} onClick={() => setActiveTab('services')}>
                  <FontAwesomeIcon icon={faConciergeBell} style={{ marginRight: '6px' }} />
                  Services — {selectedCountryForServices.country_name}
                </button>
              )}
            </div>
            {activeTab === 'countries' && (
              <button className="btn-primary" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} /> Add Country
              </button>
            )}
            {activeTab === 'services' && (
              <button className="btn-primary" onClick={() => openCreateService()}>
                <FontAwesomeIcon icon={faPlus} /> Add Service Set
              </button>
            )}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* =================== COUNTRIES TAB =================== */}
          {activeTab === 'countries' && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0' }}>
                  <FontAwesomeIcon icon={faGlobe} className="page-icon" /> Country Management
                </h1>
              </div>

              <div className="leads-filters">
                <div className="search-box">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input type="text" className="input-field" placeholder="Search countries..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-group">
                  <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading countries...</div>
              ) : (
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Country Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCountries.length > 0 ? filteredCountries.map(country => (
                        <tr key={country.id}>
                          <td><strong>{country.country_name}</strong></td>
                          <td>
                            <span className={`status-badge ${country.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              <FontAwesomeIcon icon={country.status === 'Active' ? faCheckCircle : faBan} style={{ marginRight: '5px' }} />
                              {country.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon" title="Manage Services"
                                onClick={() => openServicesTab(country)}
                                style={{ background: '#E8F5E9', color: '#2E7D32', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faConciergeBell} />
                              </button>
                              <button className="btn-icon btn-edit" title="Edit" onClick={() => openEditModal(country)}>
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button className="btn-icon btn-delete" title="Delete"
                                onClick={() => { setCountryToDelete(country); setShowDeleteModal(true); }}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>No countries found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* =================== SERVICES TAB =================== */}
          {activeTab === 'services' && selectedCountryForServices && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => setActiveTab('countries')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    ← Back to Countries
                  </button>
                  <h2 style={{ margin: 0 }}>
                    <FontAwesomeIcon icon={faConciergeBell} style={{ marginRight: '8px', color: '#F47B20' }} />
                    Services for <strong>{selectedCountryForServices.country_name}</strong>
                  </h2>
                </div>
                <p style={{ color: '#666', fontSize: '13px', margin: '8px 0 0 0' }}>
                  Each service set has a main title and bullet sub-services. On invoices you select a whole set; sub-services are included by default and can be unchecked.
                </p>
              </div>

              {servicesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading services...</div>
              ) : services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#888', background: '#fafafa', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                  No service sets yet. Click "Add Service Set" to create one for {selectedCountryForServices.country_name}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {services.map(set => (
                    <div key={set.id} style={{
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', background: '#FFF8F0', borderBottom: '1px solid #FFE0B2'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{
                            background: '#F47B20', color: '#fff', fontSize: '11px', fontWeight: 700,
                            padding: '2px 8px', borderRadius: '6px', flexShrink: 0
                          }}>{set.display_order}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '14px' }}>{set.service_name}</div>
                            {set.description && (
                              <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>{set.description}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button className="btn-icon" title="Add sub-service"
                            onClick={() => openCreateService(set.id)}
                            style={{ background: '#E8F5E9', color: '#2E7D32', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                          <button className="btn-icon btn-edit" title="Edit set" onClick={() => openEditService(set)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="btn-icon btn-delete" title="Delete set"
                            onClick={() => { setServiceToDelete(set); setShowServiceDeleteModal(true); }}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>

                      <ul style={{ margin: 0, padding: '12px 18px 14px 36px', listStyle: 'disc' }}>
                        {(set.sub_services || []).length > 0 ? (set.sub_services || []).map(sub => (
                          <li key={sub.id} style={{
                            marginBottom: '8px', color: '#374151', fontSize: '13px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                          }}>
                            <span>
                              <span style={{ color: '#9ca3af', fontSize: '11px', marginRight: '8px', fontWeight: 600 }}>{sub.display_order}.</span>
                              {sub.service_name}
                            </span>
                            <span style={{ display: 'inline-flex', gap: '4px' }}>
                              <button className="btn-icon btn-edit" title="Edit" onClick={() => openEditService(sub, set.id)}
                                style={{ padding: '4px 6px', fontSize: '11px' }}>
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button className="btn-icon btn-delete" title="Delete"
                                onClick={() => { setServiceToDelete(sub); setShowServiceDeleteModal(true); }}
                                style={{ padding: '4px 6px', fontSize: '11px' }}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </span>
                          </li>
                        )) : (
                          <li style={{ listStyle: 'none', marginLeft: '-18px', color: '#9ca3af', fontSize: '13px' }}>
                            No sub-services yet. Click + to add bullet points under this set.
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Country Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={modalMode === 'create' ? faPlus : faEdit} style={{ marginRight: '10px' }} />
                {modalMode === 'create' ? 'Add New Country' : 'Edit Country'}
              </h2>
              <button className="modal-close" onClick={closeModal}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Country Name <span style={{ color: 'red' }}>*</span></label>
                  <input type="text" className={`input-field ${formErrors.countryName ? 'error' : ''}`}
                    placeholder="Enter country name" value={formData.countryName}
                    onChange={e => setFormData({ ...formData, countryName: e.target.value })} />
                  {formErrors.countryName && <span className="error-message">{formErrors.countryName}</span>}
                </div>
                <div className="form-group">
                  <label>Status <span style={{ color: 'red' }}>*</span></label>
                  <select className={`input-field ${formErrors.status ? 'error' : ''}`} value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {formErrors.status && <span className="error-message">{formErrors.status}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (modalMode === 'create' ? 'Add Country' : 'Update Country')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Country Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faTrash} style={{ marginRight: '10px', color: '#F44336' }} />Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{countryToDelete?.country_name}</strong>?</p>
              <p style={{ color: '#F44336', fontSize: '14px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="btn-primary" onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#F44336' }}>
                {deleting ? 'Deleting...' : 'Delete Country'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Create/Edit Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={serviceModalMode === 'create' ? faPlus : faEdit} style={{ marginRight: '10px' }} />
                {serviceModalMode === 'create'
                  ? (isCreatingSub ? 'Add Sub-Service' : 'Add Service Set')
                  : (isEditingSub ? 'Edit Sub-Service' : 'Edit Service Set')}
              </h2>
              <button className="modal-close" onClick={() => setShowServiceModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              {(isCreatingSub || isEditingSub) && parentName && (
                <div style={{
                  background: '#FFF8F0', border: '1px solid #FFE0B2', borderRadius: '8px',
                  padding: '10px 12px', marginBottom: '14px', fontSize: '13px', color: '#E65100'
                }}>
                  <FontAwesomeIcon icon={faList} style={{ marginRight: '6px' }} />
                  Under: <strong>{parentName}</strong>
                </div>
              )}
              <div className="form-group">
                <label>
                  {isCreatingSub || isEditingSub ? 'Sub-Service Name' : 'Main Service Name'}{' '}
                  <span style={{ color: 'red' }}>*</span>
                </label>
                <input type="text" className={`input-field ${serviceFormErrors.serviceName ? 'error' : ''}`}
                  placeholder={isCreatingSub || isEditingSub
                    ? 'e.g. University Selection'
                    : 'e.g. Processing Charges for UK Undergraduate UCAS'}
                  value={serviceForm.serviceName}
                  onChange={e => setServiceForm({ ...serviceForm, serviceName: e.target.value })} />
                {serviceFormErrors.serviceName && <span className="error-message">{serviceFormErrors.serviceName}</span>}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input-field" rows="2" placeholder="Optional description"
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" className="input-field" min="1" max="999"
                  value={serviceForm.displayOrder}
                  onChange={e => setServiceForm({ ...serviceForm, displayOrder: e.target.value })} />
              </div>
              {serviceModalMode === 'create' && !serviceForm.parentId && (
                <div className="form-group">
                  <label>Sub-Services (one per line)</label>
                  <textarea className="input-field" rows="8"
                    placeholder={"Consultancy and Counselling\nUniversity Selection\nCourse Selection\n..."}
                    value={serviceForm.subServicesText}
                    onChange={e => setServiceForm({ ...serviceForm, subServicesText: e.target.value })} />
                  <small style={{ color: '#888', fontSize: '12px' }}>
                    Optional. Each line becomes a bullet under this main service.
                  </small>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowServiceModal(false)} disabled={serviceSubmitting}>Cancel</button>
              <button className="btn-primary" onClick={handleServiceSubmit} disabled={serviceSubmitting}>
                {serviceSubmitting ? 'Saving...' : (serviceModalMode === 'create' ? 'Add' : 'Update')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Delete Modal */}
      {showServiceDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowServiceDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faTrash} style={{ marginRight: '10px', color: '#F44336' }} />Delete Service</h2>
              <button className="modal-close" onClick={() => setShowServiceDeleteModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <p>Delete <strong>"{serviceToDelete?.service_name}"</strong>?</p>
              {!serviceToDelete?.parent_id && (
                <p style={{ color: '#F44336', fontSize: '13px' }}>
                  This will also delete all sub-services under this set.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowServiceDeleteModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#F44336' }} onClick={handleDeleteService} disabled={serviceDeleting}>
                {serviceDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
