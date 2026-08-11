import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/logs.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faArrowLeft,
  faSave,
  faUser,
  faClock
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function EditLog() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        log_id: '',
        visitorName: '',
        visitorType: '',
        contactNo: '',
        email: '',
        address: '',
        idType: '',
        idNumber: '',
        purpose: '',
        visitDate: '',
        timeIn: '',
        timeOut: '',
        personToMeet: '',
        department: '',
        remarks: '',
        status: 'In Progress'
    });

    useEffect(() => {
        if (id) {
            fetchLogData();
        }
    }, [id]);

    const fetchLogData = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_URL}/visitor-logs/${id}`);
            const data = await response.json();
            
            if (data.success) {
                const log = data.log;
                setFormData({
                    log_id: log.log_id,
                    visitorName: log.visitor_name,
                    visitorType: log.visitor_type,
                    contactNo: log.contact_no,
                    email: log.email || '',
                    address: log.address || '',
                    idType: log.id_type || '',
                    idNumber: log.id_number || '',
                    purpose: log.purpose,
                    visitDate: log.visit_date ? log.visit_date.split('T')[0] : '',
                    timeIn: log.time_in || '',
                    timeOut: log.time_out || '',
                    personToMeet: log.person_to_meet || '',
                    department: log.department || '',
                    remarks: log.remarks || '',
                    status: log.status
                });
            } else {
                setError(data.message || 'Failed to fetch visitor log');
            }
        } catch (err) {
            console.error('Error fetching visitor log:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/visitor-logs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Visitor log updated successfully!');
                navigate('/visitor-logs');
            } else {
                setError(data.message || 'Failed to update visitor log');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Error updating visitor log:', err);
            setError('Network error. Please check your connection.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="main-content" id="mainContent">
                    <Header />
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading visitor log...</p>
                    </div>
                </div>
            </>
        );
    }

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
                                Edit Visitor Log
                            </h1>
                        </div>
                        <div className="header-right">
                            <Link to="/visitor-logs" className="btn-secondary">
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Back to Logs
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

                    {/* Log ID Display */}
                    <div className="student-id-card">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="student-id-info">
                                    <span className="id-label">Log ID:</span>
                                    <span className="student-id-display">{formData.log_id}</span>
                                </div>
                            </div>
                            <div className="col-md-6 text-right">
                                <span className={`status-badge ${formData.status === 'Completed' ? 'status-completed' : 'status-in-progress'}`}>
                                    {formData.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <form className="log-form" onSubmit={handleSubmit}>
                        {/* Visitor Information Section */}
                        <div className="form-section">
                            <div className="section-header-with-icon">
                                <FontAwesomeIcon icon={faUser} className="section-icon" />
                                <h2 className="section-title">Visitor Information</h2>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="visitorName">Visitor Name <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            id="visitorName"
                                            name="visitorName"
                                            className="input-field form-control" 
                                            placeholder="Enter full name"
                                            value={formData.visitorName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="visitorType">Visitor Type <span className="required">*</span></label>
                                        <select 
                                            id="visitorType"
                                            name="visitorType"
                                            className="input-field form-control"
                                            value={formData.visitorType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Visitor Type</option>
                                            <option value="Student">Student</option>
                                            <option value="Parent">Parent/Guardian</option>
                                            <option value="Counselor">Counselor</option>
                                            <option value="Maintenance">Maintenance (Electrician, AC Repair, etc.)</option>
                                            <option value="Vendor">Vendor/Supplier</option>
                                            <option value="Official">Official/Government</option>
                                            <option value="Guest">Guest</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="contactNo">Contact Number <span className="required">*</span></label>
                                        <input 
                                            type="tel" 
                                            id="contactNo"
                                            name="contactNo"
                                            className="input-field form-control" 
                                            placeholder="+92-300-1234567"
                                            value={formData.contactNo}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email"
                                            name="email"
                                            className="input-field form-control" 
                                            placeholder="visitor@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="address">Address</label>
                                        <textarea 
                                            id="address"
                                            name="address"
                                            className="input-field form-control" 
                                            rows="2" 
                                            placeholder="Enter visitor address"
                                            value={formData.address}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="idType">ID Type</label>
                                        <select 
                                            id="idType"
                                            name="idType"
                                            className="input-field form-control"
                                            value={formData.idType}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="CNIC">CNIC</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Driving License">Driving License</option>
                                            <option value="Student ID">Student ID Card</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="idNumber">ID Number</label>
                                        <input 
                                            type="text" 
                                            id="idNumber"
                                            name="idNumber"
                                            className="input-field form-control" 
                                            placeholder="Enter ID number"
                                            value={formData.idNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visit Details Section */}
                        <div className="form-section">
                            <div className="section-header-with-icon">
                                <FontAwesomeIcon icon={faClock} className="section-icon" />
                                <h2 className="section-title">Visit Details</h2>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="purpose">Purpose of Visit <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            id="purpose"
                                            name="purpose"
                                            className="input-field form-control"
                                            placeholder="e.g., Admission Inquiry, Document Submission, Meeting"
                                            value={formData.purpose}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="visitDate">Visit Date <span className="required">*</span></label>
                                        <input 
                                            type="date" 
                                            id="visitDate"
                                            name="visitDate"
                                            className="input-field form-control"
                                            value={formData.visitDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="timeIn">Time In <span className="required">*</span></label>
                                        <input 
                                            type="time" 
                                            id="timeIn"
                                            name="timeIn"
                                            className="input-field form-control"
                                            value={formData.timeIn}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="timeOut">Time Out</label>
                                        <input 
                                            type="time" 
                                            id="timeOut"
                                            name="timeOut"
                                            className="input-field form-control"
                                            value={formData.timeOut}
                                            onChange={handleChange}
                                        />
                                        <small className="form-text">Leave empty if visitor is still in office</small>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="personToMeet">Person to Meet</label>
                                        <input 
                                            type="text" 
                                            id="personToMeet"
                                            name="personToMeet"
                                            className="input-field form-control"
                                            placeholder="e.g., Principal Office, Sarah Johnson"
                                            value={formData.personToMeet}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="department">Department</label>
                                        <input 
                                            type="text" 
                                            id="department"
                                            name="department"
                                            className="input-field form-control"
                                            placeholder="e.g., Admissions, Finance, Administration"
                                            value={formData.department}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="status">Status <span className="required">*</span></label>
                                        <select 
                                            id="status"
                                            name="status"
                                            className="input-field form-control"
                                            value={formData.status}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="remarks">Additional Remarks</label>
                                        <textarea 
                                            id="remarks"
                                            name="remarks"
                                            className="input-field form-control" 
                                            rows="3" 
                                            placeholder="Any additional notes or remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <Link to="/visitor-logs" className="btn-secondary">
                                Cancel
                            </Link>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                <FontAwesomeIcon icon={faSave} />
                                {saving ? 'Updating...' : 'Update Log Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}