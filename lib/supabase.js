import { createClient } from '@supabase/supabase-js';

// The anon key is safe to expose in client code (protected by Row Level Security).
const SUPABASE_URL = 'https://mwotoycsaphyipbgyecn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RveWNzYXBoeWlwYmd5ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQwNjUsImV4cCI6MjA5ODg3MDA2NX0.sYE8SEc6Kl8-2ElBSPH-V8C7JxQVJkA0x-_iUugXI2s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const CATEGORIES = [
  { key: 'overall', label: 'Overall', hint: 'Your gut feel for the whole day out — would you go back?' },
  { key: 'value', label: 'Value', hint: 'Was it worth the green fee?' },
  { key: 'conditions', label: 'Conditions', hint: 'Fairways, greens, tee boxes and bunkers on the day.' },
  { key: 'layout', label: 'Layout', hint: 'The design: variety, challenge and memorability of the holes.' },
  { key: 'clubhouse', label: 'Clubhouse', hint: 'Halfway house, 19th hole, showers and facilities.' },
  { key: 'staff', label: 'Staff', hint: 'Pro shop, starter, caddies and service all round.' },
];

// Bayesian-weighted score so one 5-star vote doesn't top the list.
export function weightedScore(avgOverall, nRatings, globalAvg) {
  const m = 3; // minimum votes for full confidence
  if (!nRatings) return 0;
  return (nRatings / (nRatings + m)) * avgOverall + (m / (nRatings + m)) * globalAvg;
}
