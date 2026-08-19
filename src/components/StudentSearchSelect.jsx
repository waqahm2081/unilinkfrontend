import React, { useEffect, useRef, useState } from 'react';
import { studentDisplayName } from '../constants/applicationOptions';

export default function StudentSearchSelect({ students, value, onChange, required = false }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = students.find((s) => String(s.id) === String(value));

  useEffect(() => {
    if (selected) setQuery(studentDisplayName(selected));
    else if (!value) setQuery('');
  }, [value, selected]);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const term = query.toLowerCase();
  const filtered = students.filter((s) => {
    const label = studentDisplayName(s).toLowerCase();
    const email = (s.email || '').toLowerCase();
    return label.includes(term) || email.includes(term);
  });

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="input-field"
        placeholder="Type student name or ID..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange('');
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        required={required && !value}
      />
      {open && (
        <div style={{
          position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
          maxHeight: '240px', overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          marginTop: '4px'
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', color: '#6b7280', fontSize: '13px' }}>No students found</div>
          ) : filtered.slice(0, 25).map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(String(s.id));
                setQuery(studentDisplayName(s));
                setOpen(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', border: 'none',
                background: String(s.id) === String(value) ? '#fff7ed' : 'white',
                padding: '10px 14px', cursor: 'pointer', fontSize: '13px'
              }}
            >
              <div style={{ fontWeight: 600 }}>{studentDisplayName(s)}</div>
              {s.email && <div style={{ color: '#6b7280', fontSize: '12px' }}>{s.email}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
