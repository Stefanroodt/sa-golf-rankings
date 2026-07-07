import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = 'https://mwotoycsaphyipbgyecn.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RveWNzYXBoeWlwYmd5ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQwNjUsImV4cCI6MjA5ODg3MDA2NX0.sYE8SEc6Kl8-2ElBSPH-V8C7JxQVJkA0x-_iUugXI2s';

const CATS = ['overall', 'value', 'conditions', 'layout', 'clubhouse', 'staff'];
const MAX_ACCOUNTS_PER_IP_PER_COURSE = 2;

export async function POST(req) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return Response.json(
      { error: 'Rating service not configured (missing service key).' },
      { status: 500 }
    );
  }

  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Sign in to rate.' }, { status: 401 });

  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await anon.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return Response.json({ error: 'Session expired — sign in again.' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }

  const { course_id, comment } = body;
  if (!course_id) return Response.json({ error: 'Missing course.' }, { status: 400 });
  if (comment && String(comment).length > 600)
    return Response.json({ error: 'Comment too long (600 max).' }, { status: 400 });

  const scores = {};
  for (const key of CATS) {
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 1 || n > 5)
      return Response.json({ error: `Rate every category 1–5 (${key}).` }, { status: 400 });
    scores[key] = n;
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ip_hash = createHash('sha256').update('pinhigh-salt:' + ip).digest('hex').slice(0, 32);

  const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  // How many OTHER accounts have rated this course from this IP?
  const { count } = await db
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', course_id)
    .eq('ip_hash', ip_hash)
    .neq('user_id', user.id);

  const suspect = (count ?? 0) >= MAX_ACCOUNTS_PER_IP_PER_COURSE;

  const { error } = await db.from('ratings').upsert(
    {
      course_id,
      user_id: user.id,
      display_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email.split('@')[0],
      ...scores,
      comment: (comment || '').trim() || null,
      ip_hash,
      suspect,
    },
    { onConflict: 'course_id,user_id' }
  );
  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ ok: true, suspect });
}
