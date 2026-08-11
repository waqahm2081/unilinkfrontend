import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faClock,
  faUser,
  faSave,
  faTimes,
  faSearch,
  faExclamationTriangle,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function MeetingScheduler({ 
  counselorId, 
  leadId = null, 
  userId = null,
  onClose, 
  onSuccess 
}) {
  const [availableClients, setAvailableClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  
  const [formData, setFormData] = useState({
    selectedClient: leadId ? `lead-${leadId}` : (userId ? `user-${userId}` : ''),
    meetingDate: '',
    meetingTime: '',
    durationMinutes: 60,
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [timeError, setTimeError] = useState('');

  // Fetch available clients (leads/students) for the counselor
  useEffect(() => {
    if (!leadId && !userId) {
      fetchAvailableClients();
    }
  }, [counselorId, leadId, userId]);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (formData.meetingDate && counselorId) {
      fetchBookedSlots();
    }
  }, [formData.meetingDate, counselorId]);

  // Validate time slot whenever time or duration changes
  useEffect(() => {
    if (formData.meetingTime && formData.durationMinutes) {
      validateTimeSlot();
    }
  }, [formData.meetingTime, formData.durationMinutes, bookedSlots]);

  const fetchAvailableClients = async () => {
    try {
      // Fetch leads assigned to counselor
      const leadsResponse = await fetch(`${API_URL}/counselors/${counselorId}/leads`);
      const leadsData = await leadsResponse.json();
      
      // Fetch students assigned to counselor
      const studentsResponse = await fetch(`${API_URL}/counselors/${counselorId}/students`);
      const studentsData = await studentsResponse.json();
      
      const clients = [
        ...(leadsData.success ? leadsData.leads.map(lead => ({
          id: `lead-${lead.id}`,
          name: lead.full_name,
          email: lead.email,
          type: 'Lead'
        })) : []),
        ...(studentsData.success ? studentsData.students.map(student => ({
          id: `user-${student.id}`,
          name: student.name,
          email: student.email,
          type: 'Student'
        })) : [])
      ];
      
      setAvailableClients(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const response = await fetch(
        `${API_URL}/counselors/${counselorId}/available-slots?date=${formData.meetingDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setBookedSlots(data.bookedSlots || []);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const validateTimeSlot = () => {
    const [hours, minutes] = formData.meetingTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + parseInt(formData.durationMinutes);
    
    // Check business hours (9 AM to 5 PM)
    if (startMinutes < 540) {
      setTimeError('Meeting cannot start before 9:00 AM');
      return false;
    }
    
    if (endMinutes > 1020) {
      setTimeError('Meeting must end by 5:00 PM');
      return false;
    }
    
    // Check for conflicts with existing meetings
    for (const slot of bookedSlots) {
      if ((startMinutes >= slot.start && startMinutes < slot.end) ||
          (endMinutes > slot.start && endMinutes <= slot.end) ||
          (startMinutes <= slot.start && endMinutes >= slot.end)) {
        const conflictStartHours = Math.floor(slot.start / 60);
        const conflictStartMinutes = slot.start % 60;
        const conflictEndHours = Math.floor(slot.end / 60);
        const conflictEndMinutes = slot.end % 60;
        
        setTimeError(
          `This time conflicts with an existing meeting (${String(conflictStartHours).padStart(2, '0')}:${String(conflictStartMinutes).padStart(2, '0')} - ${String(conflictEndHours).padStart(2, '0')}:${String(conflictEndMinutes).padStart(2, '0')})`
        );
        return false;
      }
    }
    
    setTimeError('');
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    
    if (!formData.selectedClient && !leadId && !userId) {
      newErrors.selectedClient = 'Please select a client';
    }
    
    if (!formData.meetingDate) {
      newErrors.meetingDate = 'Please select a date';
    }
    
    if (!formData.meetingTime) {
      newErrors.meetingTime = 'Please select a time';
    }
    
    if (!formData.durationMinutes || formData.durationMinutes < 15) {
      newErrors.durationMinutes = 'Duration must be at least 15 minutes';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (timeError) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Determine if it's a lead or student
      let endpoint;
      let clientIdValue;
      
      if (leadId) {
        endpoint = `${API_URL}/leads/${leadId}/meetings`;
        clientIdValue = leadId;
      } else if (userId) {
        // For students, we'll need a similar endpoint
        endpoint = `${API_URL}/students/${userId}/meetings`;
        clientIdValue = userId;
      } else {
        const [type, id] = formData.selectedClient.split('-');
        if (type === 'lead') {
          endpoint = `${API_URL}/leads/${id}/meetings`;
          clientIdValue = id;
        } else {
          endpoint = `${API_URL}/students/${id}/meetings`;
          clientIdValue = id;
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counselorId: counselorId,
          meetingDate: formData.meetingDate,
          meetingTime: formData.meetingTime,
          durationMinutes: formData.durationMinutes,
          notes: formData.notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Meeting scheduled successfully!');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        alert(data.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="row g-3">
          {/* Client Selection - Only show if not pre-selected */}
          {!leadId && !userId && (
            <div className="col-12">
              <div className="modal-form-group">
                <label htmlFor="selectedClient">
                  Select Client <span className="required">*</span>
                </label>
                
                {/* Search Box */}
                <div className="search-box mb-2" style={{position: 'relative'}}>
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Search by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Client List */}
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <div 
                        key={client.id}
                        onClick={() => handleInputChange({ 
                          target: { name: 'selectedClient', value: client.id } 
                        })}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          border: formData.selectedClient === client.id ? '2px solid #F47B20' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: formData.selectedClient === client.id ? '#fff7ed' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div>
                            <div style={{fontWeight: '600', marginBottom: '4px'}}>
                              {client.name}
                            </div>
                            <div style={{fontSize: '13px', color: '#6b7280'}}>
                              {client.email}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: client.type === 'Lead' ? '#dbeafe' : '#dcfce7',
                            color: client.type === 'Lead' ? '#1e40af' : '#166534'
                          }}>
                            {client.type}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                      {searchTerm ? 'No clients found matching your search' : 'No clients assigned yet'}
                    </div>
                  )}
                </div>
                {errors.selectedClient && (
                  <span style={{color: '#dc2626', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                    {errors.selectedClient}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Meeting Date */}
          <div className="col-md-12">
            <div className="modal-form-group">
              <label htmlFor="meetingDate">
                <FontAwesomeIcon icon={faCalendarAlt} style={{marginRight: '8px'}} />
                Meeting Date <span className="required">*</span>
              </label>
              <input 
                type="date" 
                id="meetingDate"
                name="meetingDate"
                className="input-field"
                value={formData.meetingDate}
                onChange={handleInputChange}
                min={today}
                required
              />
              {errors.meetingDate && (
                <span style={{color: '#dc2626', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                  {errors.meetingDate}
                </span>
              )}
            </div>
          </div>

          {/* Time Slots Visualization */}
          {formData.meetingDate && bookedSlots.length > 0 && (
            <div className="col-12">
              <div style={{
                background: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151'}}>
                  Booked Time Slots:
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {bookedSlots.map((slot, index) => {
                    const startHours = Math.floor(slot.start / 60);
                    const startMinutes = slot.start % 60;
                    const endHours = Math.floor(slot.end / 60);
                    const endMinutes = slot.end % 60;
                    
                    return (
                      <div key={index} style={{
                        padding: '6px 12px',
                        background: '#fecaca',
                        color: '#991b1b',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {String(startHours).padStart(2, '0')}:{String(startMinutes).padStart(2, '0')} - {String(endHours).padStart(2, '0')}:{String(endMinutes).padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Meeting Time */}
          <div className="col-md-6">
            <div className="modal-form-group">
              <label htmlFor="meetingTime">
                <FontAwesomeIcon icon={faClock} style={{marginRight: '8px'}} />
                Start Time <span className="required">*</span>
              </label>
              <select 
                id="meetingTime"
                name="meetingTime"
                className="input-field"
                value={formData.meetingTime}
                onChange={handleInputChange}
                required
              >
                <option value="">Select time...</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.meetingTime && (
                <span style={{color: '#dc2626', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                  {errors.meetingTime}
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="col-md-6">
            <div className="modal-form-group">
              <label htmlFor="durationMinutes">
                Duration <span className="required">*</span>
              </label>
              <select 
                id="durationMinutes"
                name="durationMinutes"
                className="input-field"
                value={formData.durationMinutes}
                onChange={handleInputChange}
                required
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
              </select>
              {errors.durationMinutes && (
                <span style={{color: '#dc2626', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                  {errors.durationMinutes}
                </span>
              )}
            </div>
          </div>

          {/* Time Conflict Warning */}
          {timeError && (
            <div className="col-12">
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{color: '#dc2626', fontSize: '18px'}} />
                <span style={{color: '#991b1b', fontSize: '14px', fontWeight: '500'}}>
                  {timeError}
                </span>
              </div>
            </div>
          )}

          {/* Meeting End Time Display */}
          {formData.meetingTime && formData.durationMinutes && !timeError && (
            <div className="col-12">
              <div style={{
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FontAwesomeIcon icon={faCheckCircle} style={{color: '#16a34a', fontSize: '18px'}} />
                <span style={{color: '#166534', fontSize: '14px', fontWeight: '500'}}>
                  Meeting will end at: {(() => {
                    const [hours, minutes] = formData.meetingTime.split(':').map(Number);
                    const endMinutes = hours * 60 + minutes + parseInt(formData.durationMinutes);
                    const endHours = Math.floor(endMinutes / 60);
                    const endMins = endMinutes % 60;
                    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="col-12">
            <div className="modal-form-group">
              <label htmlFor="notes">
                Meeting Notes (Optional)
              </label>
              <textarea 
                id="notes"
                name="notes"
                className="input-field"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter meeting agenda or notes..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      
      <div className="modal-footer">
        <button 
          type="button" 
          className="btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading || !!timeError}
        >
          <FontAwesomeIcon icon={faSave} />
          {loading ? 'Scheduling...' : 'Schedule Meeting'}
        </button>
      </div>
    </form>
  );
}