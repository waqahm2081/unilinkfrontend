export const APPLICATION_CHANNELS = [
  'INTO',
  'ApplyBoard',
  'Shorelight',
  'Edify',
  'Gradix',
  'FCH',
  'CheckUni',
  'ERN',
  'Direct',
  'CommonApp',
  'Other',
];

export const TAGGING_STATUS_OPTIONS = ['Tagged', 'Not Tagged'];

export const APPLICATION_STATUS_OPTIONS = [
  'In Progress',
  'Pending',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Closed',
];

export const OFFER_LETTER_OPTIONS = [
  'Conditional',
  'Unconditional',
  'I-20',
  'CAS',
  'LOA',
  'Other',
];

export const PAID_STATUS_OPTIONS = ['Paid', 'Unpaid', 'Not Required'];
export const TUITION_STATUS_OPTIONS = ['Paid', 'Unpaid'];

export const APPLICATION_DOCUMENT_TYPES = [
  'Passport',
  'Educational Documents',
  'Extra Curriculum Certificates',
  'English Proficiency Test',
  'CV',
  'Letter of Reference',
  'Essay/SOP',
  'Other',
];

const INTAKE_MONTHS = ['Jan', 'Feb', 'March', 'April', 'July', 'August', 'Sept', 'Oct', 'Nov'];

export const getIntakeOptions = () => {
  const year = new Date().getFullYear();
  const years = Array.from(new Set([year, year + 1, 2026]));
  years.sort();
  const options = [];
  years.forEach((y) => {
    INTAKE_MONTHS.forEach((month) => options.push(`${month} ${y}`));
  });
  options.push('Other');
  return options;
};

export const studentDisplayName = (student) => {
  if (!student) return '';
  const fullName = [student.name, student.middle_name, student.surname].filter(Boolean).join(' ');
  return student.student_id ? `${student.student_id} - ${fullName}` : fullName;
};

export const normalizeTaggingStatus = (value) => {
  if (value === 'Received' || value === 'Tagged') return 'Tagged';
  return 'Not Tagged';
};

export const displayOtherOption = (value, other) => {
  if (!value) return '';
  if ((value === 'Other' || String(value).startsWith('Other')) && other) {
    return String(value).startsWith('Other:') ? value : `Other: ${other}`;
  }
  return value;
};

export const displayFeeStatus = (status, amount) => {
  if (!status) return '';
  if (status === 'Paid' && amount) return `Paid (${amount})`;
  return status;
};
