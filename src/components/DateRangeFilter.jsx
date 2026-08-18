import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChevronDown, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import {
  EMPTY_DATE_RANGE,
  addDays,
  formatDateRangeLabel,
  hasDateRange,
  startOfMonthYMD,
  todayYMD,
  toYMD,
} from '../utils/dateRange';
import '../styles/dateRangeFilter.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    const day = daysInPrev - startOffset + i + 1;
    const date = new Date(year, month - 1, day);
    cells.push({ ymd: toYMD(date), day, outside: true });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ ymd: toYMD(date), day, outside: false });
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (startOffset + daysInMonth) + 1;
    const date = new Date(year, month + 1, day);
    cells.push({ ymd: toYMD(date), day, outside: true });
  }
  return cells;
}

export default function DateRangeFilter({ label = 'Date range', value, onChange, align = 'right' }) {
  const range = value || EMPTY_DATE_RANGE;
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState('');
  const [viewDate, setViewDate] = useState(() => {
    const seed = range.from || todayYMD();
    const [y, m] = seed.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        if (draft.from && !draft.to) {
          applyRange({ from: draft.from, to: draft.from });
        }
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, draft]);

  const openPicker = () => {
    setDraft(range.from || range.to ? range : EMPTY_DATE_RANGE);
    setSelectingEnd(Boolean(range.from) && !range.to);
    const seed = range.from || todayYMD();
    const [y, m] = seed.split('-').map(Number);
    setViewDate({ year: y, month: m - 1 });
    setOpen(true);
  };

  const applyRange = (next) => {
    const normalized = next.from && next.to && next.from > next.to
      ? { from: next.to, to: next.from }
      : next;
    onChange(normalized);
    setDraft(normalized);
  };

  const handleDayClick = (ymd) => {
    if (!draft.from || (draft.from && draft.to) || !selectingEnd) {
      setDraft({ from: ymd, to: '' });
      setSelectingEnd(true);
      setHoverDate('');
      return;
    }
    const next = ymd < draft.from ? { from: ymd, to: draft.from } : { from: draft.from, to: ymd };
    applyRange(next);
    setSelectingEnd(false);
    setOpen(false);
  };

  const clearRange = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    applyRange(EMPTY_DATE_RANGE);
    setSelectingEnd(false);
    setHoverDate('');
    setOpen(false);
  };

  const applyPreset = (from, to) => {
    applyRange({ from, to });
    setSelectingEnd(false);
    setOpen(false);
  };

  const today = todayYMD();
  const previewTo = selectingEnd && hoverDate ? hoverDate : draft.to;
  const previewFrom = draft.from;
  const displayLabel = formatDateRangeLabel(range.from, range.to);
  const days = useMemo(
    () => buildCalendarDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  );
  const monthLabel = new Date(viewDate.year, viewDate.month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta) => {
    const next = new Date(viewDate.year, viewDate.month + delta, 1);
    setViewDate({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div className="date-range-filter" ref={wrapperRef}>
      <div
        className={`date-range-trigger ${open ? 'is-open' : ''} ${hasDateRange(range) ? 'has-value' : ''}`}
        onClick={() => (open ? setOpen(false) : openPicker())}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open ? setOpen(false) : openPicker(); } }}
      >
        <FontAwesomeIcon icon={faCalendarAlt} className="date-range-trigger-icon" />
        <span className="date-range-trigger-text">
          {displayLabel ? (
            <span className="date-range-value">{displayLabel}</span>
          ) : (
            <span className="date-range-placeholder">{label}</span>
          )}
        </span>
        <span className="date-range-trigger-actions">
          {hasDateRange(range) && (
            <span
              className="date-range-clear"
              role="button"
              tabIndex={0}
              onClick={clearRange}
              onKeyDown={(e) => { if (e.key === 'Enter') clearRange(e); }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </span>
          )}
          <FontAwesomeIcon icon={faChevronDown} className="date-range-chevron" />
        </span>
      </div>

      {open && (
        <div className={`date-range-dropdown ${align === 'left' ? 'align-left' : ''}`}>
          <div className="date-range-calendar-header">
            <button type="button" className="date-range-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span className="date-range-month-label">{monthLabel}</span>
            <button type="button" className="date-range-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>

          <div className="date-range-weekdays">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="date-range-days">
            {days.map((cell) => {
              const start = previewFrom;
              const end = previewTo || (selectingEnd ? previewFrom : '');
              const lo = start && end && start > end ? end : start;
              const hi = start && end && start > end ? start : end;
              const isStart = start && cell.ymd === start;
              const isEnd = end && cell.ymd === end;
              const inRange = lo && hi && cell.ymd > lo && cell.ymd < hi;
              return (
                <button
                  key={cell.ymd + (cell.outside ? '-o' : '')}
                  type="button"
                  className={[
                    'date-range-day',
                    cell.outside ? 'is-outside' : '',
                    cell.ymd === today ? 'is-today' : '',
                    inRange ? 'is-in-range' : '',
                    isStart ? 'is-range-start' : '',
                    isEnd ? 'is-range-end' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(cell.ymd)}
                  onMouseEnter={() => selectingEnd && setHoverDate(cell.ymd)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="date-range-presets">
            <button type="button" className="date-range-preset" onClick={() => applyPreset(today, today)}>Today</button>
            <button type="button" className="date-range-preset" onClick={() => applyPreset(addDays(today, -6), today)}>Last 7 days</button>
            <button type="button" className="date-range-preset" onClick={() => applyPreset(addDays(today, -29), today)}>Last 30 days</button>
            <button type="button" className="date-range-preset" onClick={() => applyPreset(startOfMonthYMD(new Date()), today)}>This month</button>
          </div>

          <div className="date-range-footer">
            <span className="date-range-hint">
              {draft.from
                ? (draft.to ? formatDateRangeLabel(draft.from, draft.to) : 'Select end date')
                : 'Select start date'}
            </span>
            {hasDateRange(draft) && (
              <button type="button" className="date-range-apply" onClick={() => clearRange()}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
