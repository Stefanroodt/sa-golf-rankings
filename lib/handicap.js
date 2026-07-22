// Pin High Number preview access — one list, used by the nav, the play hub
// and the handicap page. Add emails here to open the preview to more people.
export const HANDICAP_PREVIEW = [
  'stevelroodt@gmail.com',
  'steyn.harley@gmail.com',
  'ryan@camicosa.com',
  'robeym@stbenedicts.co.za',
];

export const canSeeHandicap = (email) => HANDICAP_PREVIEW.includes((email || '').toLowerCase());
