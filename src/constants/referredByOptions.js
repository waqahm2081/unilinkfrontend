export const REFERRED_BY_OPTIONS = [
  'Social Media',
  'Friend or Family',
  'Website',
  'Walk-in',
  'Education Fair',
  'School / College',
  'Advertisement',
  'Other',
];

const LEGACY_SOURCE_INQUIRY_MAP = {
  website: 'Website',
  referral: 'Friend or Family',
  'social-media': 'Social Media',
  advertisement: 'Advertisement',
  'walk-in': 'Walk-in',
  other: 'Other',
};

/** Map old slug values to current Referred By labels. */
export const normalizeSourceInquiry = (value) => {
  if (!value) return '';
  return LEGACY_SOURCE_INQUIRY_MAP[value] || value;
};
