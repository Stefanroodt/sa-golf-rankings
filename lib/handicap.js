// Pin High Number preview access — one list, used by the nav, the play hub
// and the handicap page. Add emails here to open the preview to more people.
export const HANDICAP_PREVIEW = ['stevelroodt@gmail.com'];

export const canSeeHandicap = (email) => HANDICAP_PREVIEW.includes(email);
