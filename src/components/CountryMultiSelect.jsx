import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import '../styles/countryMultiSelect.css';

export default function CountryMultiSelect({
  countries = [],
  selected = [],
  onToggle,
  otherValue = '',
  onOtherChange,
  disabled = false,
  readOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  const selectedSet = useMemo(() => new Set(selected || []), [selected]);
  const otherSelected = selectedSet.has('Other');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = countries.map(c => c.country_name).filter(Boolean);
    if (!q) return list;
    return list.filter(name => name.toLowerCase().includes(q));
  }, [countries, query]);

  const showOtherOption = !query.trim() || 'other'.includes(query.trim().toLowerCase());

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isLocked = disabled || readOnly;

  const openPicker = () => {
    if (isLocked) return;
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const toggle = (name) => {
    if (isLocked) return;
    const wasSelected = selectedSet.has(name);
    onToggle(name);
    if (name === 'Other' && wasSelected && onOtherChange) {
      onOtherChange('');
    }
    setQuery('');
    searchRef.current?.focus();
  };

  const removeChip = (e, name) => {
    e.stopPropagation();
    toggle(name);
  };

  return (
    <div className={`country-multi-select${readOnly ? ' read-only' : ''}`} ref={wrapRef}>
      <div
        className={`cms-field${open ? ' open' : ''}${isLocked ? ' disabled' : ''}`}
        onClick={openPicker}
      >
        <div className="cms-chips">
          {(selected || []).length === 0 && readOnly ? (
            <span className="cms-readonly-empty">None selected</span>
          ) : (
            (selected || []).map(name => (
              <span key={name} className="cms-chip">
                {name}
                {!readOnly && (
                  <button
                    type="button"
                    className="cms-chip-remove"
                    onClick={(e) => removeChip(e, name)}
                    disabled={disabled}
                    aria-label={`Remove ${name}`}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </span>
            ))
          )}
          {!readOnly && (
            <div className="cms-search-wrap">
              <FontAwesomeIcon icon={faSearch} className="cms-search-icon" />
              <input
                ref={searchRef}
                type="text"
                className="cms-search-input"
                value={query}
                placeholder={(selected || []).length ? 'Add another…' : 'Search and select countries'}
                disabled={disabled}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!open) setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setQuery('');
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered[0]) toggle(filtered[0]);
                    else if (showOtherOption) toggle('Other');
                  }
                }}
              />
            </div>
          )}
        </div>
        {!readOnly && (
          <div className="cms-field-meta">
            {(selected || []).length > 0 && (
              <span className="cms-count">{selected.length} selected</span>
            )}
            <FontAwesomeIcon icon={faChevronDown} className={`cms-chevron${open ? ' up' : ''}`} />
          </div>
        )}
      </div>

      {open && !readOnly && (
        <div className="cms-dropdown">
          {countries.length === 0 ? (
            <div className="cms-empty">Loading countries...</div>
          ) : filtered.length === 0 && !showOtherOption ? (
            <div className="cms-empty">No countries match “{query}”</div>
          ) : (
            <ul className="cms-list">
              {filtered.map(name => {
                const isOn = selectedSet.has(name);
                return (
                  <li key={name}>
                    <button
                      type="button"
                      className={`cms-option${isOn ? ' selected' : ''}`}
                      onClick={() => toggle(name)}
                    >
                      <span className={`cms-check${isOn ? ' on' : ''}`}>
                        {isOn && <FontAwesomeIcon icon={faCheck} />}
                      </span>
                      <span>{name}</span>
                    </button>
                  </li>
                );
              })}
              {showOtherOption && (
                <li>
                  <button
                    type="button"
                    className={`cms-option cms-option-other${otherSelected ? ' selected' : ''}`}
                    onClick={() => toggle('Other')}
                  >
                    <span className={`cms-check${otherSelected ? ' on' : ''}`}>
                      {otherSelected && <FontAwesomeIcon icon={faCheck} />}
                    </span>
                    <span>Other</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {otherSelected && readOnly && otherValue && (
        <div className="cms-other-readonly">Other: {otherValue}</div>
      )}
      {otherSelected && !readOnly && (
        <input
          type="text"
          className="cms-other-input"
          placeholder="Please specify the country"
          value={otherValue || ''}
          onChange={(e) => onOtherChange && onOtherChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
