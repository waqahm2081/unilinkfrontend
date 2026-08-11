import React, { useState, useEffect, useCallback } from 'react';
import '../styles/dashboard.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt, faChevronLeft, faChevronRight,
  faClock, faUser, faUserTie, faUserGraduate,
  faTimes, faCircle, faFilter, faSearch,
  faCheckCircle, faBan, faHourglassHalf,
  faMapMarkerAlt, faStickyNote, faPhone,
  faEnvelope, faIdBadge, faCalendarDay,
  faListUl, faCalendarWeek,
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const STATUS_CONFIG = {
  Scheduled:  { color: '#F47B20', bg: '#fff7ed', border: '#fed7aa', icon: faHourglassHalf },
  Completed:  { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: faCheckCircle   },
  Cancelled:  { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: faBan            },
};

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function endTime(time24, durationMinutes) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + Number(durationMinutes);
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  const ampm = eh >= 12 ? 'PM' : 'AM';
  const eh12 = eh % 12 || 12;
  return `${eh12}:${String(em).padStart(2,'0')} ${ampm}`;
}

export default function MeetingsCalendar() {
  const today = new Date();

  const [meetings,       setMeetings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [currentDate,    setCurrentDate]    = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedMeeting,setSelectedMeeting]= useState(null);
  const [filterStatus,   setFilterStatus]   = useState('All');
  const [filterCounselor,setFilterCounselor]= useState('All');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [view,           setView]           = useState('month'); // 'month' | 'list'

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/meetings/all`);
      const data = await res.json();
      if (data.success) setMeetings(data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  // ── derived data ───────────────────────────────────────────────────────────
  const counselorOptions = ['All', ...Array.from(new Set(meetings.map(m => m.counselor_name).filter(Boolean)))];

  const filteredMeetings = meetings.filter(m => {
    const matchStatus    = filterStatus    === 'All' || m.status === filterStatus;
    const matchCounselor = filterCounselor === 'All' || m.counselor_name === filterCounselor;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q
      || (m.student_name     || '').toLowerCase().includes(q)
      || (m.counselor_name   || '').toLowerCase().includes(q)
      || (m.meeting_date     || '').includes(q);
    return matchStatus && matchCounselor && matchSearch;
  });

  // group by date string 'YYYY-MM-DD'
  const byDate = filteredMeetings.reduce((acc, m) => {
    const d = m.meeting_date?.split('T')[0] || m.meeting_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  // ── calendar grid ──────────────────────────────────────────────────────────
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++)         cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)     cells.push(d);
  while (cells.length % 7 !== 0)             cells.push(null);

  const pad = n => String(n).padStart(2,'0');
  const dateKey = d => `${year}-${pad(month+1)}-${pad(d)}`;
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday   = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:     meetings.length,
    scheduled: meetings.filter(m => m.status === 'Scheduled').length,
    completed: meetings.filter(m => m.status === 'Completed').length,
    cancelled: meetings.filter(m => m.status === 'Cancelled').length,
  };

  // ── list view sorted ───────────────────────────────────────────────────────
  const sortedForList = [...filteredMeetings].sort((a, b) => {
    const da = (a.meeting_date?.split('T')[0] || '') + (a.meeting_time || '');
    const db = (b.meeting_date?.split('T')[0] || '') + (b.meeting_time || '');
    return da.localeCompare(db);
  });

  // ── render helpers ─────────────────────────────────────────────────────────
  const MeetingDot = ({ meeting, compact = false }) => {
    const cfg = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.Scheduled;
    return (
      <div
        onClick={e => { e.stopPropagation(); setSelectedMeeting(meeting); }}
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderLeft: `3px solid ${cfg.color}`,
          borderRadius: '5px',
          padding: compact ? '2px 5px' : '3px 6px',
          marginBottom: '2px',
          cursor: 'pointer',
          fontSize: compact ? '10px' : '11px',
          lineHeight: '1.3',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = 'none'; }}
      >
        <span style={{ color: cfg.color, fontWeight: '700' }}>{fmt12(meeting.meeting_time)}</span>
        {' '}
        <span style={{ color: '#374151' }}>{meeting.student_name || meeting.student_id}</span>
      </div>
    );
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />

        <div style={{ padding: '24px 28px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

          {/* ── Page Title ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '44px', height: '44px', background: 'linear-gradient(135deg, #F47B20, #e8660f)',
                  borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(244,123,32,0.35)',
                }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ color: 'white', fontSize: '20px' }} />
                </span>
                Meetings Calendar
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '6px 0 0 56px' }}>
                All scheduled, completed &amp; cancelled meetings across leads and students
              </p>
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', gap: '2px' }}>
              {[
                { key: 'month', icon: faCalendarWeek, label: 'Month' },
                { key: 'list',  icon: faListUl,       label: 'List'  },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  style={{
                    padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: view === v.key ? 'white' : 'transparent',
                    color: view === v.key ? '#F47B20' : '#6b7280',
                    fontWeight: view === v.key ? '700' : '500',
                    fontSize: '13px',
                    boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <FontAwesomeIcon icon={v.icon} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Stats Row ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total',     value: stats.total,     color: '#6366f1', bg: '#eef2ff', icon: faCalendarAlt   },
              { label: 'Scheduled', value: stats.scheduled, color: '#F47B20', bg: '#fff7ed', icon: faHourglassHalf },
              { label: 'Completed', value: stats.completed, color: '#16a34a', bg: '#f0fdf4', icon: faCheckCircle   },
              { label: 'Cancelled', value: stats.cancelled, color: '#dc2626', bg: '#fef2f2', icon: faBan           },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', borderRadius: '14px', padding: '18px 20px',
                border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FontAwesomeIcon icon={s.icon} style={{ color: s.color, fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', fontWeight: '500' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '16px 20px',
            border: '1px solid #f3f4f6', marginBottom: '20px',
            display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
          }}>
            <FontAwesomeIcon icon={faFilter} style={{ color: '#9ca3af', fontSize: '14px' }} />

            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }} />
              <input
                type="text"
                placeholder="Search student, counselor, date…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', 'Scheduled', 'Completed', 'Cancelled'].map(s => {
                const cfg = STATUS_CONFIG[s];
                const active = filterStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
                      borderColor: active ? (cfg?.color || '#F47B20') : '#e5e7eb',
                      background: active ? (cfg?.bg || '#fff7ed') : 'white',
                      color: active ? (cfg?.color || '#F47B20') : '#6b7280',
                      fontWeight: active ? '700' : '500',
                      fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {s !== 'All' && <FontAwesomeIcon icon={cfg.icon} style={{ marginRight: '5px', fontSize: '10px' }} />}
                    {s}
                  </button>
                );
              })}
            </div>

            {/* Counselor dropdown */}
            <select
              value={filterCounselor}
              onChange={e => setFilterCounselor(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px',
                fontSize: '13px', outline: 'none', cursor: 'pointer', minWidth: '160px',
              }}
            >
              {counselorOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All Counselors' : c}</option>)}
            </select>
          </div>

          {/* ── Calendar / List body ───────────────────────────────────────── */}
          {loading ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📅</div>
              <p style={{ color: '#6b7280', fontSize: '15px' }}>Loading meetings…</p>
            </div>
          ) : view === 'month' ? (
            /* ══════════ MONTH VIEW ══════════ */
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

              {/* Month nav */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              }}>
                <button onClick={prevMonth} style={navBtnStyle}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                    {MONTHS[month]} {year}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                    {filteredMeetings.filter(m => {
                      const d = m.meeting_date?.split('T')[0] || '';
                      return d.startsWith(`${year}-${pad(month+1)}`);
                    }).length} meetings this month
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={goToday} style={{ ...navBtnStyle, padding: '6px 14px', fontSize: '12px', fontWeight: '600' }}>
                    Today
                  </button>
                  <button onClick={nextMonth} style={navBtnStyle}>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {DAYS.map(d => (
                  <div key={d} style={{
                    padding: '10px 0', textAlign: 'center', fontSize: '12px',
                    fontWeight: '700', color: '#9ca3af', letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {cells.map((day, idx) => {
                  const key       = day ? dateKey(day) : null;
                  const dayMtgs   = key ? (byDate[key] || []) : [];
                  const isToday   = key === todayKey;
                  const isWeekend = idx % 7 === 0 || idx % 7 === 6;
                  const maxShow   = 3;
                  const overflow  = dayMtgs.length - maxShow;

                  return (
                    <div
                      key={idx}
                      style={{
                        minHeight: '110px',
                        borderRight: (idx % 7 !== 6) ? '1px solid #f3f4f6' : 'none',
                        borderBottom: '1px solid #f3f4f6',
                        padding: '6px',
                        background: !day ? '#fafafa' : isWeekend ? '#fafbff' : 'white',
                        transition: 'background 0.1s',
                      }}
                    >
                      {day && (
                        <>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '26px', height: '26px', borderRadius: '50%', marginBottom: '4px',
                            background: isToday ? '#F47B20' : 'transparent',
                            color: isToday ? 'white' : dayMtgs.length > 0 ? '#111827' : '#6b7280',
                            fontSize: '13px', fontWeight: isToday || dayMtgs.length > 0 ? '700' : '400',
                          }}>
                            {day}
                          </div>

                          {dayMtgs.slice(0, maxShow).map((m, i) => (
                            <MeetingDot key={i} meeting={m} compact />
                          ))}

                          {overflow > 0 && (
                            <div
                              style={{
                                fontSize: '10px', color: '#F47B20', fontWeight: '700',
                                padding: '2px 6px', background: '#fff7ed', borderRadius: '4px',
                                cursor: 'pointer', display: 'inline-block',
                              }}
                              onClick={() => {
                                setFilterStatus('All');
                                setView('list');
                              }}
                            >
                              +{overflow} more
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ══════════ LIST VIEW ══════════ */
            <div>
              {sortedForList.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
                  <p style={{ color: '#6b7280', fontSize: '15px' }}>No meetings match your filters.</p>
                </div>
              ) : (
                sortedForList.reduce((acc, meeting, idx, arr) => {
                  const d = meeting.meeting_date?.split('T')[0];
                  const prevD = idx > 0 ? arr[idx-1].meeting_date?.split('T')[0] : null;

                  if (d !== prevD) {
                    const dt = new Date(d + 'T00:00:00');
                    const isT = d === todayKey;
                    acc.push(
                      <div key={`header-${d}`} style={{
                        padding: '8px 0 6px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginTop: idx > 0 ? '18px' : 0,
                      }}>
                        <div style={{
                          padding: '4px 14px', borderRadius: '20px',
                          background: isT ? '#F47B20' : '#1a1a2e',
                          color: 'white', fontSize: '13px', fontWeight: '700',
                          boxShadow: isT ? '0 2px 8px rgba(244,123,32,0.4)' : 'none',
                        }}>
                          {isT ? '📅 Today — ' : ''}{dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                      </div>
                    );
                  }

                  const cfg = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.Scheduled;
                  const isLead = !!meeting.lead_id;

                  acc.push(
                    <div
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      style={{
                        background: 'white', borderRadius: '12px', border: '1px solid #f3f4f6',
                        borderLeft: `4px solid ${cfg.color}`,
                        padding: '16px 20px', marginBottom: '8px', cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                        transition: 'box-shadow 0.15s, transform 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {/* Time block */}
                      <div style={{
                        minWidth: '80px', textAlign: 'center', padding: '8px 12px',
                        background: cfg.bg, borderRadius: '10px', border: `1px solid ${cfg.border}`,
                      }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: cfg.color }}>{fmt12(meeting.meeting_time)}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{meeting.duration_minutes} min</div>
                      </div>

                      {/* Counselor */}
                      <div style={{ flex: '1 1 160px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Counselor</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>
                          <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20', marginRight: '6px', fontSize: '12px' }} />
                          {meeting.counselor_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{meeting.counselor_id_code}</div>
                      </div>

                      {/* Student / Lead */}
                      <div style={{ flex: '1 1 160px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          {isLead ? 'Lead' : 'Student'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>
                          <FontAwesomeIcon icon={isLead ? faUser : faUserGraduate} style={{ color: '#6366f1', marginRight: '6px', fontSize: '12px' }} />
                          {meeting.student_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{meeting.student_id}</div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        whiteSpace: 'nowrap',
                      }}>
                        <FontAwesomeIcon icon={cfg.icon} style={{ marginRight: '5px', fontSize: '10px' }} />
                        {meeting.status}
                      </span>
                    </div>
                  );
                  return acc;
                }, [])
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ MEETING DETAIL MODAL ══════════ */}
      {selectedMeeting && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.55)',
              backdropFilter: 'blur(3px)', zIndex: 1040,
            }}
            onClick={() => setSelectedMeeting(null)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1050, width: '92%', maxWidth: '520px',
            background: 'white', borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'modalIn 0.2s ease',
          }}>

            {/* Modal header — coloured by status */}
            {(() => {
              const m   = selectedMeeting;
              const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.Scheduled;
              const isLead = !!m.lead_id;

              return (
                <>
                  <div style={{
                    background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`,
                    padding: '22px 24px',
                    position: 'relative',
                  }}>
                    {/* Status stripe */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                      background: cfg.color,
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                          background: cfg.bg, color: cfg.color, marginBottom: '10px',
                        }}>
                          <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: '10px' }} />
                          {m.status}
                        </span>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                          {isLead ? '👤 Lead Meeting' : '🎓 Student Meeting'}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMeeting(null)}
                        style={{
                          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px',
                          width: '34px', height: '34px', cursor: 'pointer', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px',
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>

                    {/* Date/time hero */}
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '52px', height: '52px', background: cfg.color,
                        borderRadius: '14px', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 14px ${cfg.color}55`,
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: 'white', lineHeight: 1 }}>
                          {new Date(m.meeting_date?.split('T')[0] + 'T00:00:00').getDate()}
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                          {MONTHS[new Date(m.meeting_date?.split('T')[0] + 'T00:00:00').getMonth()]?.substring(0,3).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>
                          {new Date(m.meeting_date?.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FontAwesomeIcon icon={faClock} style={{ fontSize: '11px' }} />
                          {fmt12(m.meeting_time)} — {endTime(m.meeting_time, m.duration_minutes)}
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 8px', borderRadius: '10px', fontSize: '11px' }}>
                            {m.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal body */}
                  <div style={{ padding: '22px 24px' }}>

                    {/* Two-column: Counselor + Student */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>

                      {/* Counselor card */}
                      <div style={{
                        background: '#fff7ed', borderRadius: '12px', padding: '14px',
                        border: '1px solid #fed7aa',
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#F47B20', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                          <FontAwesomeIcon icon={faUserTie} style={{ marginRight: '5px' }} />
                          Counselor
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{m.counselor_name}</div>
                        {m.counselor_id_code && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FontAwesomeIcon icon={faIdBadge} style={{ fontSize: '10px' }} />
                            {m.counselor_id_code}
                          </div>
                        )}
                        {m.counselor_email && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '10px' }} />
                            {m.counselor_email}
                          </div>
                        )}
                      </div>

                      {/* Student/Lead card */}
                      <div style={{
                        background: isLead ? '#f5f3ff' : '#eff6ff',
                        borderRadius: '12px', padding: '14px',
                        border: `1px solid ${isLead ? '#ddd6fe' : '#bfdbfe'}`,
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: isLead ? '#7c3aed' : '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                          <FontAwesomeIcon icon={isLead ? faUser : faUserGraduate} style={{ marginRight: '5px' }} />
                          {isLead ? 'Lead' : 'Student'}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{m.student_name}</div>
                        {m.student_id && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FontAwesomeIcon icon={faIdBadge} style={{ fontSize: '10px' }} />
                            {m.student_id}
                          </div>
                        )}
                        {m.student_email && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '10px' }} />
                            {m.student_email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {m.notes && (
                      <div style={{
                        background: '#f9fafb', borderRadius: '10px', padding: '14px',
                        border: '1px solid #f3f4f6', marginBottom: '14px',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FontAwesomeIcon icon={faStickyNote} />
                          Notes
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{m.notes}</p>
                      </div>
                    )}

                    {/* Meeting notes image */}
                    {m.meeting_notes_image && (
                      <a
                        href={`${API_URL}${m.meeting_notes_image}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 14px', background: '#f0fdf4',
                          border: '1px solid #86efac', borderRadius: '10px',
                          textDecoration: 'none', color: '#16a34a', fontWeight: '600', fontSize: '13px',
                          marginBottom: '14px',
                        }}
                      >
                        📎 View Attached Document
                      </a>
                    )}

                    {/* Close button */}
                    <button
                      onClick={() => setSelectedMeeting(null)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -47%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}

const navBtnStyle = {
  background: 'rgba(255,255,255,0.12)',
  border: 'none', borderRadius: '8px',
  width: '36px', height: '36px',
  color: 'white', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '14px', transition: 'background 0.15s',
};