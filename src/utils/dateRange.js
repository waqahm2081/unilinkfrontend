/** Extract YYYY-MM-DD without timezone shifting DATE-only values. */
export function toYMD(dateValue) {
  if (!dateValue) return '';
  const raw = String(dateValue);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateRangeLabel(from, to) {
  if (!from && !to) return '';
  if (from && to && from === to) return formatDisplayDate(from);
  if (from && to) return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
  return formatDisplayDate(from || to);
}

export function isDateInRange(dateValue, from, to) {
  if (!from && !to) return true;
  const ymd = toYMD(dateValue);
  if (!ymd) return false;
  if (from && ymd < from) return false;
  if (to && ymd > to) return false;
  return true;
}

export function addDays(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toYMD(date);
}

export function startOfMonthYMD(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function todayYMD() {
  return toYMD(new Date());
}

export const EMPTY_DATE_RANGE = { from: '', to: '' };

export function hasDateRange(range) {
  return Boolean(range?.from || range?.to);
}
