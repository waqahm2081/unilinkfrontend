import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import '../styles/visa.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPassport,
    faArrowLeft,
    faSave,
    faUpload,
    faTimes,
    faFile,
    faUser
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function EditVisa() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        visaNumber: '',
        visaType: 'Study Visa',
        visaStatus: 'To be applied',
        unconditionalOffer: 'NO',
        visaLetter: 'NO',
        accommodation: '',
        tbCertificate: 'NO',
        affidavit: 'NO',
        financialDocuments: 'NO',
        visaLink: '',
        visaPassword: '',
        visaAppointmentDate: '',
        visaOutcome: '',
        institute: '',
        submissionDate: '',
        submittedBy: '',
    });

    // New files to upload
    const [feeReceipts, setFeeReceipts] = useState([]);
    const [birthCertificate, setBirthCertificate] = useState(null);
    const [financialDocs, setFinancialDocs] = useState([]);
    const [travelHistory, setTravelHistory] = useState(null);
    const [passportPhotos, setPassportPhotos] = useState([]);

    // Existing files from database
    const [existingFiles, setExistingFiles] = useState({
        feeReceipts: [],
        birthCertificate: null,
        financialDocs: [],
        travelHistory: null,
        passportPhotos: []
    });

    useEffect(() => {
        fetchVisaData();
    }, [id]);

    const fetchVisaData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/visas/${id}`);
            const data = await response.json();

            if (data.success) {
                const visa = data.visa;

                setFormData({
                    visaNumber: visa.visa_number || '',
                    visaType: visa.visa_type || 'Study Visa',
                    visaStatus: visa.visa_status || 'Pending',
                    unconditionalOffer: visa.unconditional_offer || 'NO',
                    visaLetter: visa.visa_letter || 'NO',
                    accommodation: visa.accommodation || '',
                    tbCertificate: visa.tb_certificate || 'NO',
                    affidavit: visa.affidavit || 'NO',
                    financialDocuments: visa.financial_documents || 'NO',
                    visaLink: visa.visa_link || '',
                    visaPassword: visa.visa_password || '',
                    visaAppointmentDate: visa.visa_appointment_date ? visa.visa_appointment_date.split('T')[0] : '',
                    visaOutcome: visa.visa_outcome || '',
                    institute: visa.institute || '',
                    submissionDate: visa.submission_date ? visa.submission_date.split('T')[0] : '',
                    submittedBy: visa.submitted_by || '',
                });

                setSelectedStudent({
                    id: visa.student_id,
                    student_id: visa.student_id,
                    name: visa.student_name,
                    email: visa.student_email,
                    mobile: visa.student_mobile,
                    address: visa.student_address,
                    country: visa.student_country
                });

                setExistingFiles({
                    feeReceipts: data.feeReceipts || [],
                    birthCertificate: visa.birth_certificate_path,
                    financialDocs: data.financialDocuments || [],
                    travelHistory: visa.travel_history_path,
                    passportPhotos: data.passportPhotos || []
                });
            } else {
                setError(data.message || 'Failed to load visa data');
            }
        } catch (error) {
            console.error('Error fetching visa:', error);
            setError('Failed to load visa data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);

        switch (type) {
            case 'feeReceipts':
                setFeeReceipts(prev => [...prev, ...files]);
                break;
            case 'birthCertificate':
                setBirthCertificate(files[0]);
                break;
            case 'financialDocs':
                setFinancialDocs(prev => [...prev, ...files]);
                break;
            case 'travelHistory':
                setTravelHistory(files[0]);
                break;
            case 'passportPhotos':
                setPassportPhotos(prev => [...prev, ...files]);
                break;
        }
    };

    const removeFile = (type, index) => {
        switch (type) {
            case 'feeReceipts':
                setFeeReceipts(prev => prev.filter((_, i) => i !== index));
                break;
            case 'birthCertificate':
                setBirthCertificate(null);
                break;
            case 'financialDocs':
                setFinancialDocs(prev => prev.filter((_, i) => i !== index));
                break;
            case 'travelHistory':
                setTravelHistory(null);
                break;
            case 'passportPhotos':
                setPassportPhotos(prev => prev.filter((_, i) => i !== index));
                break;
        }
    };

    const deleteExistingFile = async (type, fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            let endpoint = '';
            switch (type) {
                case 'feeReceipt':
                    endpoint = `${API_URL}/visas/${id}/fee-receipts/${fileId}`;
                    break;
                case 'birthCertificate':
                    endpoint = `${API_URL}/visas/${id}/birth-certificate`;
                    break;
                case 'financialDoc':
                    endpoint = `${API_URL}/visas/${id}/financial-documents/${fileId}`;
                    break;
                case 'travelHistory':
                    endpoint = `${API_URL}/visas/${id}/travel-history`;
                    break;
                case 'passportPhoto':
                    endpoint = `${API_URL}/visas/${id}/passport-photos/${fileId}`;
                    break;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                // Update existing files state
                setExistingFiles(prev => {
                    const updated = { ...prev };
                    switch (type) {
                        case 'feeReceipt':
                            updated.feeReceipts = prev.feeReceipts.filter(f => f.id !== fileId);
                            break;
                        case 'birthCertificate':
                            updated.birthCertificate = null;
                            break;
                        case 'financialDoc':
                            updated.financialDocs = prev.financialDocs.filter(f => f.id !== fileId);
                            break;
                        case 'travelHistory':
                            updated.travelHistory = null;
                            break;
                        case 'passportPhoto':
                            updated.passportPhotos = prev.passportPhotos.filter(f => f.id !== fileId);
                            break;
                    }
                    return updated;
                });

                setSuccess('File deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            setError('Failed to delete file');
            setTimeout(() => setError(''), 3000);
        }
    };

    const uploadFiles = async (visaId) => {
        try {
            // Upload fee receipts
            for (const file of feeReceipts) {
                const formData = new FormData();
                formData.append('feeReceipt', file);
                formData.append('receiptName', file.name);

                await fetch(`${API_URL}/visas/${visaId}/fee-receipts`, {
                    method: 'POST',
                    body: formData
                });
            }

            // Upload birth certificate
            if (birthCertificate) {
                const formData = new FormData();
                formData.append('birthCertificate', birthCertificate);

                await fetch(`${API_URL}/visas/${visaId}/birth-certificate`, {
                    method: 'POST',
                    body: formData
                });
            }

            // Upload financial documents
            for (const file of financialDocs) {
                const formData = new FormData();
                formData.append('financialDocument', file);
                formData.append('documentName', file.name);

                await fetch(`${API_URL}/visas/${visaId}/financial-documents`, {
                    method: 'POST',
                    body: formData
                });
            }

            // Upload travel history
            if (travelHistory) {
                const formData = new FormData();
                formData.append('travelHistory', travelHistory);

                await fetch(`${API_URL}/visas/${visaId}/travel-history`, {
                    method: 'POST',
                    body: formData
                });
            }

            // Upload passport photos
            for (const file of passportPhotos) {
                const formData = new FormData();
                formData.append('passportPhoto', file);

                await fetch(`${API_URL}/visas/${visaId}/passport-photos`, {
                    method: 'POST',
                    body: formData
                });
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const visaData = {
                studentId: selectedStudent.id,
                ...formData
            };

            const response = await fetch(`${API_URL}/visas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visaData)
            });

            const data = await response.json();

            if (data.success) {
                // Upload new files
                await uploadFiles(id);

                setSuccess('Visa updated successfully!');
                setTimeout(() => {
                    navigate('/visa');
                }, 1500);
            } else {
                setError(data.message || 'Failed to update visa');
            }
        } catch (error) {
            console.error('Error saving visa:', error);
            setError('Failed to update visa');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedStudent) {
        return (
            <>
                <Sidebar />
                <div className="main-content">
                    <Header />
                    <div className="container-fluid">
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading visa data...</p>
                        </div>
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

                <div className="container-fluid">
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="mb-2">
                                        <FontAwesomeIcon icon={faPassport} className="me-2 text-primary" />
                                        Edit Visa
                                    </h1>
                                </div>
                                <div>
                                    <Link to="/visa" className="btn btn-secondary">
                                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                        Back to Visa
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Student Information Section */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title mb-4">Student Information</h5>

                                        {selectedStudent && (
                                            <div className="selected-student-card">
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="student-avatar me-3">
                                                        <FontAwesomeIcon icon={faUser} />
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1">{selectedStudent.name}</h6>
                                                        <span className="badge bg-primary">{selectedStudent.student_id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visa Details Section */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title mb-4">Visa Details</h5>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label htmlFor="visaNumber" className="form-label">Visa Number</label>
                                                <input
                                                    type="text"
                                                    id="visaNumber"
                                                    name="visaNumber"
                                                    className="form-control"
                                                    placeholder="Enter visa number"
                                                    value={formData.visaNumber}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="visaType" className="form-label">Visa Type <span className="text-danger">*</span></label>
                                                <select
                                                    id="visaType"
                                                    name="visaType"
                                                    className="form-select form-control"
                                                    value={formData.visaType}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="Study Visa">Study Visa</option>
                                                    <option value="Work Visa">Work Visa</option>
                                                    <option value="Visitor">Visitor</option>
                                                    <option value="Exchange">Exchange</option>
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="visaStatus" className="form-label">Visa Status <span className="text-danger">*</span></label>
                                                <select
                                                    id="visaStatus"
                                                    name="visaStatus"
                                                    className="form-select form-control"
                                                    value={formData.visaStatus}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="To be applied">To be applied</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Approved">Approved</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="visaAppointmentDate" className="form-label">Visa Appointment Date</label>
                                                <input
                                                    type="date"
                                                    id="visaAppointmentDate"
                                                    name="visaAppointmentDate"
                                                    className="form-control"
                                                    value={formData.visaAppointmentDate}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="institute" className="form-label">Institute</label>
                                                <input
                                                    type="text"
                                                    id="institute"
                                                    name="institute"
                                                    className="form-control"
                                                    placeholder="Enter institute / university name"
                                                    value={formData.institute}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="submissionDate" className="form-label">Submission Date</label>
                                                <input
                                                    type="date"
                                                    id="submissionDate"
                                                    name="submissionDate"
                                                    className="form-control"
                                                    value={formData.submissionDate}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-12">
                                                <label htmlFor="submittedBy" className="form-label">Submitted By</label>
                                                <input
                                                    type="text"
                                                    id="submittedBy"
                                                    name="submittedBy"
                                                    className="form-control"
                                                    placeholder="Enter name of person who submitted"
                                                    value={formData.submittedBy}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="unconditionalOffer" className="form-label">Unconditional Offer</label>
                                                <select
                                                    id="unconditionalOffer"
                                                    name="unconditionalOffer"
                                                    className="form-select form-control"
                                                    value={formData.unconditionalOffer}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="NO">NO</option>
                                                    <option value="YES">YES</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="visaLetter" className="form-label">Visa Letter</label>
                                                <select
                                                    id="visaLetter"
                                                    name="visaLetter"
                                                    className="form-select form-control"
                                                    value={formData.visaLetter}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="NO">NO</option>
                                                    <option value="YES">YES</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="tbCertificate" className="form-label">TB Certificate</label>
                                                <select
                                                    id="tbCertificate"
                                                    name="tbCertificate"
                                                    className="form-select form-control"
                                                    value={formData.tbCertificate}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="NO">NO</option>
                                                    <option value="YES">YES</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="affidavit" className="form-label">Affidavit</label>
                                                <select
                                                    id="affidavit"
                                                    name="affidavit"
                                                    className="form-select form-control"
                                                    value={formData.affidavit}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="NO">NO</option>
                                                    <option value="YES">YES</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="financialDocuments" className="form-label">Financial Documents</label>
                                                <select
                                                    id="financialDocuments"
                                                    name="financialDocuments"
                                                    className="form-select form-control"
                                                    value={formData.financialDocuments}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="NO">NO</option>
                                                    <option value="YES">YES</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="accommodation" className="form-label">Accommodation</label>
                                                <input
                                                    type="text"
                                                    id="accommodation"
                                                    name="accommodation"
                                                    className="form-control"
                                                    placeholder="Enter accommodation details"
                                                    value={formData.accommodation}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-8">
                                                <label htmlFor="visaLink" className="form-label">Visa Link</label>
                                                <input
                                                    type="url"
                                                    id="visaLink"
                                                    name="visaLink"
                                                    className="form-control"
                                                    placeholder="Enter visa application link"
                                                    value={formData.visaLink}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label htmlFor="visaPassword" className="form-label">Visa Password</label>
                                                <input
                                                    type="text"
                                                    id="visaPassword"
                                                    name="visaPassword"
                                                    className="form-control"
                                                    placeholder="Enter visa portal password"
                                                    value={formData.visaPassword}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="col-12">
                                                <label htmlFor="visaOutcome" className="form-label">Visa Outcome</label>
                                                <textarea
                                                    id="visaOutcome"
                                                    name="visaOutcome"
                                                    className="form-control"
                                                    rows="3"
                                                    placeholder="Enter visa outcome details"
                                                    value={formData.visaOutcome}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title mb-4">Document Uploads</h5>

                                        <div className="row g-4">
                                            {/* Fee Receipts */}
                                            <div className="col-12">
                                                <label className="form-label">Fee Receipts (Multiple)</label>
                                                <div className="file-upload-container">
                                                    <input
                                                        type="file"
                                                        id="feeReceipts"
                                                        multiple
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        onChange={(e) => handleFileChange(e, 'feeReceipts')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="feeReceipts" className="btn btn-outline-primary">
                                                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                                                        Add More Files
                                                    </label>

                                                    {/* Existing files */}
                                                    {existingFiles.feeReceipts.length > 0 && (
                                                        <div className="uploaded-files mt-3">
                                                            <h6 className="mb-2">Existing Files:</h6>
                                                            {existingFiles.feeReceipts.map((file) => (
                                                                <div key={file.id} className="file-item">
                                                                    <FontAwesomeIcon icon={faFile} className="text-success me-2" />
                                                                    <a
                                                                        href={`${API_URL}${file.file_path}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-grow-1 text-decoration-none"
                                                                    >
                                                                        {file.receipt_name}
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => deleteExistingFile('feeReceipt', file.id)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* New files */}
                                                    {feeReceipts.length > 0 && (
                                                        <div className="uploaded-files mt-3">
                                                            <h6 className="mb-2">New Files to Upload:</h6>
                                                            {feeReceipts.map((file, index) => (
                                                                <div key={index} className="file-item">
                                                                    <FontAwesomeIcon icon={faFile} className="text-primary me-2" />
                                                                    <span className="flex-grow-1">{file.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => removeFile('feeReceipts', index)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Birth Certificate */}
                                            <div className="col-md-12">
                                                <label className="form-label">Birth Certificate (Single)</label>
                                                <div className="file-upload-container">
                                                    <input
                                                        type="file"
                                                        id="birthCertificate"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        onChange={(e) => handleFileChange(e, 'birthCertificate')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="birthCertificate" className="btn btn-outline-primary">
                                                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                                                        {existingFiles.birthCertificate ? 'Replace File' : 'Choose File'}
                                                    </label>

                                                    {existingFiles.birthCertificate && !birthCertificate && (
                                                        <div className="uploaded-files mt-3">
                                                            <div className="file-item">
                                                                <FontAwesomeIcon icon={faFile} className="text-success me-2" />
                                                                <a
                                                                    href={`${API_URL}${existingFiles.birthCertificate}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-grow-1 text-decoration-none"
                                                                >
                                                                    Birth Certificate (View/Download)
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => deleteExistingFile('birthCertificate')}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {birthCertificate && (
                                                        <div className="uploaded-files mt-3">
                                                            <div className="file-item">
                                                                <FontAwesomeIcon icon={faFile} className="text-primary me-2" />
                                                                <span className="flex-grow-1">{birthCertificate.name} (New)</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => removeFile('birthCertificate')}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Travel History */}
                                            <div className="col-md-12">
                                                <label className="form-label">Travel History Printed (Single)</label>
                                                <div className="file-upload-container">
                                                    <input
                                                        type="file"
                                                        id="travelHistory"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        onChange={(e) => handleFileChange(e, 'travelHistory')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="travelHistory" className="btn btn-outline-primary">
                                                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                                                        {existingFiles.travelHistory ? 'Replace File' : 'Choose File'}
                                                    </label>

                                                    {existingFiles.travelHistory && !travelHistory && (
                                                        <div className="uploaded-files mt-3">
                                                            <div className="file-item">
                                                                <FontAwesomeIcon icon={faFile} className="text-success me-2" />
                                                                <a
                                                                    href={`${API_URL}${existingFiles.travelHistory}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-grow-1 text-decoration-none"
                                                                >
                                                                    Travel History (View/Download)
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => deleteExistingFile('travelHistory')}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {travelHistory && (
                                                        <div className="uploaded-files mt-3">
                                                            <div className="file-item">
                                                                <FontAwesomeIcon icon={faFile} className="text-primary me-2" />
                                                                <span className="flex-grow-1">{travelHistory.name} (New)</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => removeFile('travelHistory')}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Financial Documents */}
                                            {formData.financialDocuments === 'YES' && (
                                                <div className="col-12">
                                                    <label className="form-label">Financial Documents (Multiple)</label>
                                                    <div className="file-upload-container">
                                                        <input
                                                            type="file"
                                                            id="financialDocs"
                                                            multiple
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            onChange={(e) => handleFileChange(e, 'financialDocs')}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <label htmlFor="financialDocs" className="btn btn-outline-primary">
                                                            <FontAwesomeIcon icon={faUpload} className="me-2" />
                                                            Add More Files
                                                        </label>

                                                        {existingFiles.financialDocs.length > 0 && (
                                                            <div className="uploaded-files mt-3">
                                                                <h6 className="mb-2">Existing Files:</h6>
                                                                {existingFiles.financialDocs.map((file) => (
                                                                    <div key={file.id} className="file-item">
                                                                        <FontAwesomeIcon icon={faFile} className="text-success me-2" />
                                                                        <a
                                                                            href={`${API_URL}${file.file_path}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex-grow-1 text-decoration-none"
                                                                        >
                                                                            {file.document_name}
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-danger"
                                                                            onClick={() => deleteExistingFile('financialDoc', file.id)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTimes} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {financialDocs.length > 0 && (
                                                            <div className="uploaded-files mt-3">
                                                                <h6 className="mb-2">New Files to Upload:</h6>
                                                                {financialDocs.map((file, index) => (
                                                                    <div key={index} className="file-item">
                                                                        <FontAwesomeIcon icon={faFile} className="text-primary me-2" />
                                                                        <span className="flex-grow-1">{file.name}</span>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-danger"
                                                                            onClick={() => removeFile('financialDocs', index)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTimes} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Passport Photos */}
                                            <div className="col-12">
                                                <label className="form-label">Passport Size Photos (Multiple)</label>
                                                <div className="file-upload-container">
                                                    <input
                                                        type="file"
                                                        id="passportPhotos"
                                                        multiple
                                                        accept=".jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileChange(e, 'passportPhotos')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="passportPhotos" className="btn btn-outline-primary">
                                                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                                                        Add More Files
                                                    </label>

                                                    {existingFiles.passportPhotos.length > 0 && (
                                                        <div className="uploaded-files mt-3">
                                                            <h6 className="mb-2">Existing Files:</h6>
                                                            {existingFiles.passportPhotos.map((file, index) => (
                                                                <div key={file.id} className="file-item">
                                                                    <FontAwesomeIcon icon={faFile} className="text-success me-2" />
                                                                    <a
                                                                        href={`${API_URL}${file.file_path}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-grow-1 text-decoration-none"
                                                                    >
                                                                        Passport Photo {index + 1} (View/Download)
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => deleteExistingFile('passportPhoto', file.id)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {passportPhotos.length > 0 && (
                                                        <div className="uploaded-files mt-3">
                                                            <h6 className="mb-2">New Files to Upload:</h6>
                                                            {passportPhotos.map((file, index) => (
                                                                <div key={index} className="file-item">
                                                                    <FontAwesomeIcon icon={faFile} className="text-primary me-2" />
                                                                    <span className="flex-grow-1">{file.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => removeFile('passportPhotos', index)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="row">
                            <div className="col-12">
                                <div className="d-flex justify-content-end gap-2">
                                    <Link to="/visa" className="btn btn-secondary">
                                        Cancel
                                    </Link>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        <FontAwesomeIcon icon={faSave} className="me-2" />
                                        {loading ? 'Updating...' : 'Update Visa'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}