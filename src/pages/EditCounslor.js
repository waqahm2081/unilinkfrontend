import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/counselors.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import MeetingScheduler from '../components/MeetingScheduler'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faArrowLeft,
  faSave,
  faCalendarAlt,
  faClock,
  faUser,
  faTrash,
  faTimes,
  faUpload,
  faImage,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function EditCounselor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [counselorData, setCounselorData] = useState({
        counselor_id: '',
        name: '',
        email: '',
        phone: '',
        experience: '',
        expertise: '',
        status: 'Active'
    });
    
    const [meetings, setMeetings] = useState([]);
    const [assignedLeads, setAssignedLeads] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesFormData, setNotesFormData] = useState({
        notes: '',
        status: '',
        notesImage: null
    });
    const [uploadingNotes, setUploadingNotes] = useState(false);

    useEffect(() => {
        fetchCounselorData();
    }, [id]);

    const fetchCounselorData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/counselors/${id}`);
            const data = await response.json();
            
            if (data.success) {
                setCounselorData(data.counselor);
                setMeetings(data.meetings || []);
                setAssignedLeads(data.assignedLeads || []);
                setAssignedStudents(data.assignedStudents || []);
            } else {
                alert(data.message || 'Failed to fetch counselor data');
                navigate('/counselors');
            }
        } catch (error) {
            console.error('Error fetching counselor:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCounselorData({
            ...counselorData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`${API_URL}/counselors/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(counselorData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Counselor updated successfully');
                navigate('/counselors');
            } else {
                alert(data.message || 'Failed to update counselor');
            }
        } catch (error) {
            console.error('Error updating counselor:', error);
            alert('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (!window.confirm('Are you sure you want to delete this meeting?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/counselors/${id}/meetings/${meetingId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                alert('Meeting deleted successfully');
                fetchCounselorData();
            } else {
                alert(data.message || 'Failed to delete meeting');
            }
        } catch (error) {
            console.error('Error deleting meeting:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleOpenNotesModal = (meeting) => {
        setSelectedMeeting(meeting);
        setNotesFormData({
            notes: meeting.notes || '',
            status: meeting.status,
            notesImage: null
        });
        setShowNotesModal(true);
    };

    const handleNotesInputChange = (e) => {
        const { name, value } = e.target;
        setNotesFormData({
            ...notesFormData,
            [name]: value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                e.target.value = '';
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPEG, PNG, GIF images and PDF files are allowed');
                e.target.value = '';
                return;
            }
            
            setNotesFormData({
                ...notesFormData,
                notesImage: file
            });
        }
    };

    const handleSaveNotes = async (e) => {
        e.preventDefault();
        setUploadingNotes(true);

        try {
            const formData = new FormData();
            formData.append('notes', notesFormData.notes);
            formData.append('status', notesFormData.status);
            
            if (notesFormData.notesImage) {
                formData.append('notesImage', notesFormData.notesImage);
            }

            const response = await fetch(`${API_URL}/meetings/${selectedMeeting.id}/notes`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Meeting notes updated successfully');
                setShowNotesModal(false);
                setSelectedMeeting(null);
                fetchCounselorData();
            } else {
                alert(data.message || 'Failed to update meeting notes');
            }
        } catch (error) {
            console.error('Error updating meeting notes:', error);
            alert('Network error. Please try again.');
        } finally {
            setUploadingNotes(false);
        }
    };

    const getMeetingStatusColor = (status) => {
        const colors = {
            'Scheduled': 'meeting-scheduled',
            'Completed': 'meeting-completed',
            'Cancelled': 'meeting-cancelled'
        };
        return colors[status] || 'meeting-scheduled';
    };

    const getClientTypeLabel = (clientType) => {
        return clientType === 'lead' ? 'Lead' : 'Student';
    };

    const getClientTypeBadgeColor = (clientType) => {
        return clientType === 'lead' ? '#dbeafe' : '#dcfce7';
    };

    const getClientTypeTextColor = (clientType) => {
        return clientType === 'lead' ? '#1e40af' : '#166534';
    };

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="main-content" id="mainContent">
                    <Header />
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading counselor data...</p>
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

                <div className="counselors-container">
                    <div className="counselors-header">
                        <div className="header-left">
                            <h1>
                                <FontAwesomeIcon icon={faUserTie} className="page-icon" />
                                Edit Counselor
                            </h1>
                        </div>
                        <div className="header-right">
                            <Link to="/counselors" className="btn-secondary">
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Back to Counselors
                            </Link>
                        </div>
                    </div>

                    <form className="counselor-form" onSubmit={handleSubmit}>
                        {/* Basic Information Section */}
                        <div className="form-section">
                            <h2 className="section-title">Basic Information</h2>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="counselor_id">Counselor ID</label>
                                        <input 
                                            type="text" 
                                            id="counselor_id"
                                            name="counselor_id"
                                            className="input-field" 
                                            value={counselorData.counselor_id}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="status">Status <span className="required">*</span></label>
                                        <select 
                                            id="status"
                                            name="status"
                                            className="input-field"
                                            value={counselorData.status}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            id="name"
                                            name="name"
                                            className="input-field" 
                                            value={counselorData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address <span className="required">*</span></label>
                                        <input 
                                            type="email" 
                                            id="email"
                                            name="email"
                                            className="input-field" 
                                            value={counselorData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                                        <input 
                                            type="tel" 
                                            id="phone"
                                            name="phone"
                                            className="input-field" 
                                            value={counselorData.phone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="experience">Experience <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            id="experience"
                                            name="experience"
                                            className="input-field" 
                                            value={counselorData.experience}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 5 Years"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="expertise">Expertise <span className="required">*</span></label>
                                        <textarea 
                                            id="expertise"
                                            name="expertise"
                                            className="input-field" 
                                            rows="3"
                                            value={counselorData.expertise}
                                            onChange={handleInputChange}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <Link to="/counselors" className="btn-secondary">
                                Cancel
                            </Link>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                <FontAwesomeIcon icon={faSave} />
                                {saving ? 'Updating...' : 'Update Counselor'}
                            </button>
                        </div>
                    </form>

                    {/* Assigned Leads Section */}
                    {assignedLeads.length > 0 && (
                        <div className="form-section" style={{marginTop: '32px'}}>
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FontAwesomeIcon icon={faUser} style={{marginRight: '10px'}} />
                                    Assigned Leads ({assignedLeads.length})
                                </h2>
                            </div>
                            <div className="row g-3">
                                {assignedLeads.map((lead) => (
                                    <div key={lead.id} className="col-md-6">
                                        <div style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            background: 'white'
                                        }}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                                                <div style={{flex: 1}}>
                                                    <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600'}}>
                                                        {lead.full_name}
                                                    </h4>
                                                    <p style={{margin: '4px 0', fontSize: '13px', color: '#6b7280'}}>
                                                        {lead.email}
                                                    </p>
                                                    <p style={{margin: '4px 0', fontSize: '13px', color: '#6b7280'}}>
                                                        <strong>Phone:</strong> {lead.phone}
                                                    </p>
                                                    <p style={{margin: '4px 0', fontSize: '13px', color: '#6b7280'}}>
                                                        <strong>Interest:</strong> {lead.interest}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    backgroundColor: '#dbeafe',
                                                    color: '#1e40af'
                                                }}>
                                                    Lead
                                                </span>
                                            </div>
                                            <Link 
                                                to={`/edit-lead/${lead.id}`}
                                                className="btn-secondary"
                                                style={{width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none'}}
                                            >
                                                View Lead Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned Students Section */}
                    {assignedStudents.length > 0 && (
                        <div className="form-section" style={{marginTop: '32px'}}>
                            <div className="section-header">
                                <h2 className="section-title">
                                    <FontAwesomeIcon icon={faUser} style={{marginRight: '10px'}} />
                                    Assigned Students ({assignedStudents.length})
                                </h2>
                            </div>
                            <div className="row g-3">
                                {assignedStudents.map((student) => (
                                    <div key={student.id} className="col-md-6">
                                        <div style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            background: 'white'
                                        }}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                                                <div style={{flex: 1}}>
                                                    <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600'}}>
                                                        {student.name}
                                                    </h4>
                                                    <p style={{margin: '4px 0', fontSize: '13px', color: '#6b7280'}}>
                                                        {student.email}
                                                    </p>
                                                    <p style={{margin: '4px 0', fontSize: '12px', color: '#9ca3af'}}>
                                                        Assigned: {new Date(student.assigned_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    backgroundColor: '#dcfce7',
                                                    color: '#166534'
                                                }}>
                                                    Student
                                                </span>
                                            </div>
                                            <Link 
                                                to={`/edit-student/${student.id}`}
                                                className="btn-secondary"
                                                style={{width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none'}}
                                            >
                                                View Student Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meetings Section */}
                    <div className="form-section" style={{marginTop: '32px'}}>
                        <div className="section-header">
                            <h2 className="section-title">
                                <FontAwesomeIcon icon={faCalendarAlt} style={{marginRight: '10px'}} />
                                Meetings Schedule
                            </h2>
                            <button 
                                type="button" 
                                className="btn-primary"
                                onClick={() => setShowMeetingModal(true)}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                Add Meeting
                            </button>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="meeting-stat-card">
                                    <span className="meeting-stat-label">Total Meetings</span>
                                    <span className="meeting-stat-value">{meetings.length}</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="meeting-stat-card">
                                    <span className="meeting-stat-label">Scheduled</span>
                                    <span className="meeting-stat-value">
                                        {meetings.filter(m => m.status === 'Scheduled').length}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="meeting-stat-card">
                                    <span className="meeting-stat-label">Completed</span>
                                    <span className="meeting-stat-value">
                                        {meetings.filter(m => m.status === 'Completed').length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="row g-3">
                            {meetings.length > 0 ? (
                                meetings.map((meeting) => (
                                    <div key={meeting.id} className="col-12">
                                        <div className="meeting-card">
                                            <div className="meeting-header">
                                                <div className="meeting-student">
                                                    <FontAwesomeIcon icon={faUser} className="meeting-icon" />
                                                    <div>
                                                        <h4>{meeting.client_name || 'N/A'}</h4>
                                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                            <span className="student-id-small">{meeting.client_id || meeting.student_id}</span>
                                                            {meeting.client_type && (
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '600',
                                                                    backgroundColor: getClientTypeBadgeColor(meeting.client_type),
                                                                    color: getClientTypeTextColor(meeting.client_type)
                                                                }}>
                                                                    {getClientTypeLabel(meeting.client_type)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`meeting-status-badge ${getMeetingStatusColor(meeting.status)}`}>
                                                    {meeting.status}
                                                </span>
                                            </div>
                                            <div className="meeting-details">
                                                <div className="meeting-info-item">
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="info-icon-small" />
                                                    <span>{new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}</span>
                                                </div>
                                                <div className="meeting-info-item">
                                                    <FontAwesomeIcon icon={faClock} className="info-icon-small" />
                                                    <span>{meeting.meeting_time} ({meeting.duration_minutes} minutes)</span>
                                                </div>
                                            </div>
                                            {meeting.notes && (
                                                <div className="meeting-notes">
                                                    <strong>Notes:</strong> {meeting.notes}
                                                </div>
                                            )}
                                            {meeting.meeting_notes_image && (
                                                <div className="meeting-notes" style={{marginTop: '10px'}}>
                                                    <strong>Attached Document:</strong>
                                                    <a 
                                                        href={`${API_URL}${meeting.meeting_notes_image}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{marginLeft: '10px', color: '#F47B20'}}
                                                    >
                                                        <FontAwesomeIcon icon={faImage} /> View Document
                                                    </a>
                                                </div>
                                            )}
                                            <div className="meeting-actions">
                                                <button 
                                                    type="button" 
                                                    className="btn-icon btn-edit"
                                                    onClick={() => handleOpenNotesModal(meeting)}
                                                    title="Add/Edit Notes"
                                                >
                                                    <FontAwesomeIcon icon={faFileAlt} />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                                    title="Delete Meeting"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <div className="no-meetings-message">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="no-meetings-icon" />
                                        <p>No meetings scheduled yet</p>
                                        <button 
                                            type="button"
                                            className="btn-primary"
                                            onClick={() => setShowMeetingModal(true)}
                                            style={{marginTop: '15px'}}
                                        >
                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                            Schedule First Meeting
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Meeting Modal */}
            {showMeetingModal && (
                <>
                    <div className="modal-backdrop show" onClick={() => setShowMeetingModal(false)}></div>
                    <div className="modal show" style={{display: 'block'}} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={faCalendarAlt} style={{marginRight: '10px'}} />
                                        Schedule New Meeting
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close-modal"
                                        onClick={() => setShowMeetingModal(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <MeetingScheduler 
                                    counselorId={id}
                                    onClose={() => setShowMeetingModal(false)}
                                    onSuccess={() => {
                                        fetchCounselorData();
                                        setShowMeetingModal(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Meeting Notes Modal */}
            {showNotesModal && selectedMeeting && (
                <>
                    <div className="modal-backdrop show" onClick={() => !uploadingNotes && setShowNotesModal(false)}></div>
                    <div className="modal show" style={{display: 'block'}} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={faFileAlt} style={{marginRight: '10px'}} />
                                        Meeting Notes & Status
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close-modal"
                                        onClick={() => setShowNotesModal(false)}
                                        disabled={uploadingNotes}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <form onSubmit={handleSaveNotes}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            {/* Meeting Info */}
                                            <div className="col-12">
                                                <div style={{
                                                    background: '#f9fafb',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    marginBottom: '16px'
                                                }}>
                                                    <div style={{fontSize: '14px', color: '#374151'}}>
                                                        <strong>Client:</strong> {selectedMeeting.client_name || selectedMeeting.student_name}
                                                    </div>
                                                    <div style={{fontSize: '14px', color: '#374151', marginTop: '4px'}}>
                                                        <strong>Date:</strong> {new Date(selectedMeeting.meeting_date).toLocaleDateString()} at {selectedMeeting.meeting_time}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-12">
                                                <div className="modal-form-group">
                                                    <label htmlFor="status">
                                                        Meeting Status <span className="required">*</span>
                                                    </label>
                                                    <select 
                                                        id="status"
                                                        name="status"
                                                        className="input-field"
                                                        value={notesFormData.status}
                                                        onChange={handleNotesInputChange}
                                                        required
                                                    >
                                                        <option value="Scheduled">Scheduled</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Written Notes */}
                                            <div className="col-12">
                                                <div className="modal-form-group">
                                                    <label htmlFor="notes">
                                                        Written Notes
                                                    </label>
                                                    <textarea 
                                                        id="notes"
                                                        name="notes"
                                                        className="input-field"
                                                        rows="5"
                                                        value={notesFormData.notes}
                                                        onChange={handleNotesInputChange}
                                                        placeholder="Enter meeting notes, discussion points, action items..."
                                                    ></textarea>
                                                </div>
                                            </div>

                                            {/* Image Upload */}
                                            <div className="col-12">
                                                <div className="modal-form-group">
                                                    <label htmlFor="notesImage">
                                                        <FontAwesomeIcon icon={faUpload} style={{marginRight: '8px'}} />
                                                        Upload Document/Image (Optional)
                                                    </label>
                                                    <input 
                                                        type="file" 
                                                        id="notesImage"
                                                        name="notesImage"
                                                        className="input-field"
                                                        accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                                                        onChange={handleImageChange}
                                                    />
                                                    <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '12px'}}>
                                                        Accepted formats: JPEG, PNG, GIF, PDF (Max 5MB)
                                                    </small>
                                                </div>
                                            </div>

                                            {/* Current Image Display */}
                                            {selectedMeeting.meeting_notes_image && !notesFormData.notesImage && (
                                                <div className="col-12">
                                                    <div style={{
                                                        background: '#f0f9ff',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #bae6fd'
                                                    }}>
                                                        <div style={{fontSize: '13px', color: '#0c4a6e', marginBottom: '8px'}}>
                                                            <FontAwesomeIcon icon={faImage} style={{marginRight: '8px'}} />
                                                            Current Document:
                                                        </div>
                                                        <a 
                                                            href={`${API_URL}${selectedMeeting.meeting_notes_image}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{color: '#F47B20', fontSize: '13px'}}
                                                        >
                                                            View Current Document
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Image Preview */}
                                            {notesFormData.notesImage && (
                                                <div className="col-12">
                                                    <div style={{
                                                        background: '#dcfce7',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #bbf7d0'
                                                    }}>
                                                        <div style={{fontSize: '13px', color: '#166534'}}>
                                                            <FontAwesomeIcon icon={faUpload} style={{marginRight: '8px'}} />
                                                            New file selected: {notesFormData.notesImage.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn-secondary"
                                            onClick={() => setShowNotesModal(false)}
                                            disabled={uploadingNotes}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-primary"
                                            disabled={uploadingNotes}
                                        >
                                            <FontAwesomeIcon icon={faSave} />
                                            {uploadingNotes ? 'Saving...' : 'Save Notes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}