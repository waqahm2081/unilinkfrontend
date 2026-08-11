import React, { useState } from 'react'
import '../styles/dashboard.css'
import '../styles/counselors.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faArrowLeft,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function CreateCounselor() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        experience: '',
        expertise: '',
        status: 'Active'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/counselors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert(`Counselor added successfully! Counselor ID: ${data.generatedId}`);
                navigate('/counselors');
            } else {
                alert(data.message || 'Failed to add counselor');
            }
        } catch (error) {
            console.error('Error creating counselor:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                                Add New Counselor
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
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name <span className="required">*</span></label>
                                        <input 
                                            type="text" 
                                            id="name"
                                            name="name"
                                            className="input-field" 
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter counselor's full name"
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
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="counselor@example.com"
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
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="+92 300 1234567"
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
                                            value={formData.experience}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 5 Years"
                                            required
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
                                            value={formData.status}
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
                                        <label htmlFor="expertise">Expertise <span className="required">*</span></label>
                                        <textarea 
                                            id="expertise"
                                            name="expertise"
                                            className="input-field" 
                                            rows="4"
                                            value={formData.expertise}
                                            onChange={handleInputChange}
                                            placeholder="e.g., MBA & Business Programs, International Universities, Scholarship Guidance"
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
                            <button type="submit" className="btn-primary" disabled={loading}>
                                <FontAwesomeIcon icon={faSave} />
                                {loading ? 'Adding...' : 'Add Counselor'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}