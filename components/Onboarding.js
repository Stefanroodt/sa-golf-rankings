'use client';

import { useEffect, useRef, useState } from 'react';

// Tooltip tour. Shows once per storageKey (localStorage flag).
// Default steps walk first-time visitors through the homepage hero;
// pass custom steps + storageKey to run it elsewhere (e.g. the play hub).
const HOME_STEPS = [
  {
    sel: null,
    title: 'Welcome to Pin High 👋',
    text: "South Africa's golf course rankings — decided by golfers, not panels. Here's the 20-second tour.",
    next: 'Show me',
  },
  {
    sel: '.hero-rate',
    title: 'Rate the courses you play ★',
    text: 'Score them on condition, greens, layout, value and more. Every rating you add moves the national rankings.',
  },
  {
    sel: '.hero-scorecard',
    title: 'Score your rounds 📋',
    text: 'Real hole-by-hole scorecards for 170+ courses. Track every round, see your best at each course.',
  },
  {
    sel: '.hero-nineteenth',
    title: "Don't forget the 19th ⛳",
    text: 'The round isn&#39;t over at 18. Rate the halfway house and the pub — we rank those too.',
  },
  {
    sel: null,
    title: 'Earn badges as you go 🏅',
    text: 'Sign in, rate your first course and you&#39;re on the leaderboard. Every rating is also an entry into the monthly draw.',
    next: 'Got it — let&#39;s go',
  },
];

export default function Onboarding({ steps = HOME_STEPS, storageKey = 'ph-tour-v1' }) {
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState(null);
  const raf = useRef(null);

  // Start once per storageKey, after the page settles
  useEffect(() => {
    if (!storageKey) return;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch { return; }
    const t = setTimeout(() => setStep(0), 900);
    return () => clearTimeout(t);
  }, [storageKey]);

  const finish = () => {
    try { localStorage.setItem(storageKey, '1'); } catch {}
    setStep(-2);
  };

  // Track the highlighted element's position
  useEffect(() => {
    if (step < 0) return;
    const s = steps[step];
    if (!s.sel) { setRect(null); return; }
    const el = document.querySelector(s.sel);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    const onMove = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(measure);
    };
    const t = setTimeout(measure, 380);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [step, steps]);

  if (step < 0) return null;
  const s = steps[step];
  const last = step === steps.length - 1;

  // Card position: under the spotlight if there's room, else above; centered otherwise
  let cardStyle = {};
  if (rect) {
    const below = rect.y + rect.h + 16;
    const useAbove = below > (typeof window !== 'undefined' ? window.innerHeight : 800) - 240;
    cardStyle = useAbove
      ? { left: '50%', transform: 'translateX(-50%)', bottom: `calc(100vh - ${rect.y - 16}px)` }
      : { left: '50%', transform: 'translateX(-50%)', top: below };
  } else {
    cardStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className="onb" role="dialog" aria-label="Welcome tour">
      {!rect && <div className="onb-dim" />}
      {rect && (
        <div
          className="onb-ring"
          style={{ left: rect.x - 8, top: rect.y - 8, width: rect.w + 16, height: rect.h + 16 }}
        />
      )}
      <div className="onb-card" style={cardStyle}>
        <button className="onb-close" onClick={finish} aria-label="Close tour">×</button>
        <h3 dangerouslySetInnerHTML={{ __html: s.title }} />
        <p dangerouslySetInnerHTML={{ __html: s.text }} />
        <div className="onb-btns">
          {step > 0 && (
            <button className="onb-back" onClick={() => setStep(step - 1)}>Back</button>
          )}
          <button
            className="onb-next"
            onClick={() => (last ? finish() : setStep(step + 1))}
            dangerouslySetInnerHTML={{ __html: s.next || (last ? 'Done' : 'Next') }}
          />
        </div>
        <div className="onb-foot">
          <span className="onb-dots">
            {steps.map((_, i) => (
              <span key={i} className={`onb-dot${i === step ? ' active' : ''}`} />
            ))}
          </span>
          {!last && (
            <button className="onb-skip" onClick={finish}>Skip tour</button>
          )}
        </div>
      </div>
    </div>
  );
}
