import { createClient } from '@supabase/supabase-js';

// The anon key is safe to expose in client code (protected by Row Level Security).
const SUPABASE_URL = 'https://mwotoycsaphyipbgyecn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RveWNzYXBoeWlwYmd5ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQwNjUsImV4cCI6MjA5ODg3MDA2NX0.sYE8SEc6Kl8-2ElBSPH-V8C7JxQVJkA0x-_iUugXI2s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const CATEGORIES = [
  { key: 'overall', label: 'Overall' },
  { key: 'value', label: 'Value' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'layout', label: 'Layout' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'staff', label: 'Staff' },
];

// Bayesian-weighted score so one 5-star vote doesn't top the list.
export function weightedScore(avgOverall, nRatings, globalAvg) {
  const m = 3; // minimum votes for full confidence
  if (!nRatings) return 0;
  return (nRatings / (nRatings + m)) * avgOverall + (m / (nRatings + m)) * globalAvg;
}
