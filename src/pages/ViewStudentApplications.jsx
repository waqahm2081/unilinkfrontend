import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/applications.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt, faArrowLeft, faDownload, faGlobe, faUniversity,
  faCalendarAlt, faCheckCircle, faClock, faTimesCircle,
  faExclamationCircle, faUser,
  faBan, faInfoCircle, faStickyNote, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { displayFeeStatus, displayOtherOption, normalizeTaggingStatus } from '../constants/applicationOptions';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

// ── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'In Progress': { bg: '#ffedd5', color: '#9a3412', icon: faSpinner },
  Pending:   { bg: '#fef9c3', color: '#854d0e', icon: faClock },
  Approved:  { bg: '#dcfce7', color: '#166534', icon: faCheckCircle },
  Accepted:  { bg: '#dbeafe', color: '#1e40af', icon: faCheckCircle },
  Rejected:  { bg: '#fee2e2', color: '#991b1b', icon: faTimesCircle },
  Withdrawn: { bg: '#f3e8ff', color: '#6b21a8', icon: faBan },
  Closed:    { bg: '#f3f4f6', color: '#374151', icon: faExclamationCircle },
};

const TAGGING_CONFIG = {
  'Tagged':       { bg: '#dcfce7', color: '#166534' },
  'Not Tagged':   { bg: '#fef9c3', color: '#854d0e' },
  'Received':     { bg: '#dcfce7', color: '#166534' },
  'Not Received': { bg: '#fef9c3', color: '#854d0e' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: '#f3f4f6', color: '#374151', icon: faInfoCircle };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
      fontWeight: '600', background: cfg.bg, color: cfg.color,
    }}>
      <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: '10px' }} />
      {status}
    </span>
  );
};

const InfoPill = ({ label, value, color = '#6b7280' }) => (
  value ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: '#f3f4f6', color, borderRadius: '6px',
      padding: '3px 9px', fontSize: '12px', fontWeight: '500',
    }}>
      <span style={{ color: '#9ca3af', fontSize: '11px' }}>{label}:</span>
      {value}
    </span>
  ) : null
);

const DocDownloadBtn = ({ href, label, iconColor }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
      fontWeight: '600', textDecoration: 'none', border: `1.5px solid ${iconColor}`,
      color: iconColor, background: 'white', transition: 'all 0.15s',
    }}
  >
    <FontAwesomeIcon icon={faDownload} />
    {label}
  </a>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function ViewStudentApplications() {
  const { studentId } = useParams();   // DB numeric id of the student (user.id)
  const navigate = useNavigate();

  const [student, setStudent]           = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [docMap, setDocMap]             = useState({});   // { appId: { manualForm, offerLetter } }

  // ── Fetch student info + their applications ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Pull all applications for this student (uses existing backend route)
        const res = await fetch(`${API_URL}/applications/student/${studentId}`);
        const data = await res.json();

        if (!data.success) {
          setError(data.message || 'Failed to load applications.');
          return;
        }

        setApplications(data.applications);

        // 2. Extract student info from first application row (backend joins user fields)
        if (data.applications.length > 0) {
          const first = data.applications[0];
          // If your student route returns student_name etc. we use them.
          // The /applications/student/:id route doesn't join user info, so we fetch
          // one full single-application record to get the student details.
          const singleRes = await fetch(`${API_URL}/applications/${first.id}`);
          const singleData = await singleRes.json();
          if (singleData.success) {
            const a = singleData.application;
            setStudent({
              name:   a.student_full_name || a.student_name,
              number: a.student_number,
              email:  a.student_email,
              mobile: a.student_mobile,
            });
          }
        }

        await fetchAllDocuments(data.applications);
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  const fetchAllDocuments = async (apps) => {
    const entries = await Promise.all(
      apps.map(async (app) => {
        try {
          const res = await fetch(`${API_URL}/applications/${app.id}/documents`);
          const data = await res.json();
          return [app.id, data.success ? (data.documents || []) : []];
        } catch {
          return [app.id, []];
        }
      })
    );
    setDocMap(Object.fromEntries(entries));
  };

  // ── Derived stats ───────────────────────────────────────────────────────
  const statCounts = applications.reduce((acc, app) => {
    acc[app.application_status] = (acc[app.application_status] || 0) + 1;
    return acc;
  }, {});

  // ── Render helpers ──────────────────────────────────────────────────────
  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── Loading / error states ──────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="main-content" id="mainContent">
          <Header />
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#6b7280' }}>
            <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px' }}>Loading student applications…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Sidebar />
        <div className="main-content" id="mainContent">
          <Header />
          <div style={{ margin: '32px', padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        </div>
      </>
    );
  }

  // ── No applications state ───────────────────────────────────────────────
  if (applications.length === 0) {
    return (
      <>
        <Sidebar />
        <div className="main-content" id="mainContent">
          <Header />
          <div className="counselors-container">
            <div className="counselors-header">
              <div className="header-left">
                <button
                  className="btn-secondary"
                  onClick={() => navigate('/applications')}
                  style={{ marginRight: '12px' }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} /> Back
                </button>
                <h1>
                  <FontAwesomeIcon icon={faFileAlt} className="page-icon" />
                  Student Applications
                </h1>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#6b7280' }}>
              <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.25 }} />
              <p style={{ fontSize: '16px', fontWeight: '600' }}>No applications found for this student.</p>
              <p style={{ fontSize: '13px' }}>Applications created for this student will appear here.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="counselors-container">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="counselors-header" style={{ marginBottom: '24px' }}>
            <div className="header-left">
              <button
                className="btn-secondary"
                onClick={() => navigate('/applications')}
                style={{ marginRight: '12px' }}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <h1>
                <FontAwesomeIcon icon={faFileAlt} className="page-icon" />
                Applications — {student?.name || 'Student'}
              </h1>
            </div>
          </div>

          {/* ── Student info card ────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #F47B20 0%, #e06010 100%)',
            borderRadius: '14px', padding: '20px 24px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FontAwesomeIcon icon={faUser} style={{ fontSize: '22px', color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
                {student?.name}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {student?.number && (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                    ID: <strong>{student.number}</strong>
                  </span>
                )}
                {student?.email && (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                    {student.email}
                  </span>
                )}
                {student?.mobile && (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                    {student.mobile}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(statCounts).map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] || { bg: '#f3f4f6', color: '#374151' };
                return (
                  <div key={status} style={{
                    background: 'rgba(255,255,255,0.18)', borderRadius: '10px',
                    padding: '8px 14px', textAlign: 'center', minWidth: '72px',
                  }}>
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '20px', lineHeight: 1 }}>{count}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '3px' }}>{status}</div>
                  </div>
                );
              })}
              <div style={{
                background: 'rgba(255,255,255,0.18)', borderRadius: '10px',
                padding: '8px 14px', textAlign: 'center', minWidth: '72px',
              }}>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '20px', lineHeight: 1 }}>{applications.length}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '3px' }}>Total</div>
              </div>
            </div>
          </div>

          {/* ── Application cards ────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {applications.map((app) => {
              const docs = docMap[app.id] || [];
              const statusCfg = STATUS_CONFIG[app.application_status] || {};
              const taggingStatus = normalizeTaggingStatus(app.tagging_status);
              const taggingCfg = TAGGING_CONFIG[taggingStatus] || {};
              const submitted = displayOtherOption(app.apps_submitted_through, app.apps_submitted_through_other);
              const tagged = displayOtherOption(app.apps_tagged_through, app.apps_tagged_through_other);
              const offerLetter = displayOtherOption(app.offer_letter_type, app.offer_letter_other);

              return (
                <div key={app.id} style={{
                  background: 'white', borderRadius: '14px', overflow: 'hidden',
                  border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  {/* Card header bar */}
                  <div style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                    background: statusCfg.bg ? `${statusCfg.bg}44` : '#fafafa',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: '#F47B20', color: 'white',
                        borderRadius: '8px', padding: '4px 10px',
                        fontSize: '12px', fontWeight: '700', letterSpacing: '0.3px',
                      }}>
                        {app.application_id}
                      </span>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                        {app.program}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={app.application_status} />
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '18px 20px' }}>

                    {/* Row 1 — Destination info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '14px', marginBottom: '14px',
                    }}>
                      <InfoBlock
                        icon={faGlobe}
                        iconColor="#3b82f6"
                        label="Country"
                        value={app.country_name}
                      />
                      <InfoBlock
                        icon={faUniversity}
                        iconColor="#8b5cf6"
                        label="University"
                        value={app.university_name || '—'}
                        italic={!app.university_name}
                      />
                      <InfoBlock
                        icon={faCalendarAlt}
                        iconColor="#f59e0b"
                        label="Intake"
                        value={app.intake_name || '—'}
                        italic={!app.intake_name}
                      />
                      <InfoBlock
                        icon={faCalendarAlt}
                        iconColor="#6b7280"
                        label="Application Date"
                        value={formatDate(app.application_date)}
                      />
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px dashed #e5e7eb', margin: '4px 0 14px' }} />

                    {/* Row 2 — Status pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      <InfoPill label="Tagging Status" value={taggingStatus} color={taggingCfg.color || '#374151'} />
                      {submitted && <InfoPill label="Submitted Through" value={submitted} />}
                      {tagged && <InfoPill label="Tagged Through" value={tagged} />}
                      {offerLetter && app.application_status === 'Accepted' && (
                        <InfoPill label="Offer Letter" value={offerLetter} />
                      )}
                      {app.university_fees && (
                        <InfoPill label="University Fees" value={app.university_fees} color="#166534" />
                      )}
                      {app.initial_deposit_status && (
                        <InfoPill label="Initial Deposit" value={displayFeeStatus(app.initial_deposit_status, app.initial_deposit_amount)} />
                      )}
                      {app.enrollment_fee_status && (
                        <InfoPill label="Enrollment Fee" value={displayFeeStatus(app.enrollment_fee_status, app.enrollment_fee_amount)} />
                      )}
                      {app.tuition_fee_status && (
                        <InfoPill label="Tuition Fee" value={displayFeeStatus(app.tuition_fee_status, app.tuition_fee_amount)} />
                      )}
                    </div>

                    {/* Condition */}
                    {app.condition && (
                      <div style={{ marginBottom: '10px' }}>
                        <LabeledText
                          icon={faExclamationCircle}
                          iconColor="#f59e0b"
                          label="Condition"
                          text={app.condition}
                        />
                      </div>
                    )}

                    {/* Remarks */}
                    {app.remarks && (
                      <div style={{ marginBottom: '10px' }}>
                        <LabeledText
                          icon={faStickyNote}
                          iconColor="#6b7280"
                          label="Remarks"
                          text={app.remarks}
                        />
                      </div>
                    )}

                    {/* Documents row */}
                    {docs.length > 0 && (
                      <>
                        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '10px 0 12px' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginRight: '4px' }}>
                            Documents:
                          </span>
                          {docs.map((doc) => (
                            <DocDownloadBtn
                              key={doc.id}
                              href={`${API_URL}${doc.file_path}`}
                              label={doc.document_type || doc.original_name || 'Document'}
                              iconColor="#7c3aed"
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function InfoBlock({ icon, iconColor, label, value, italic }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        background: `${iconColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: '13px', color: iconColor }} />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{
          fontSize: '13px', fontWeight: '600', color: italic ? '#9ca3af' : '#111827',
          fontStyle: italic ? 'italic' : 'normal',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function LabeledText({ icon, iconColor, label, text }) {
  return (
    <div style={{
      background: '#f9fafb', borderRadius: '8px', padding: '10px 14px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: '11px', color: iconColor }} />
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{text}</p>
    </div>
  );
}