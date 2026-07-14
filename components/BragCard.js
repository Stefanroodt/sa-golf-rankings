'use client';

import { useState } from 'react';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const F = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export default function BragCard({ name, rated, total, badgeCount, badgeNames = [], bestCourse }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function share() {
    setBusy(true);
    setNote(null);
    try {
      const W = 1080, H = 1920;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');

      x.fillStyle = '#0e2f21'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#1a4a34';
      x.beginPath(); x.ellipse(W / 2, H + 120, 920, 480, 0, 0, Math.PI * 2); x.fill();

      const cx = W / 2, cy = 250, u = 165;
      x.fillStyle = '#f7f3e9'; rr(x, cx - 5, cy - u * 0.62, 10, u * 1.2, 5); x.fill();
      x.fillStyle = '#c9a227';
      x.beginPath(); x.moveTo(cx + 5, cy - u * 0.62); x.lineTo(cx + u * 0.6, cy - u * 0.4);
      x.lineTo(cx + 5, cy - u * 0.18); x.closePath(); x.fill();
      x.fillStyle = '#081c13';
      x.beginPath(); x.ellipse(cx, cy + u * 0.62, 60, 20, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f7f3e9';
      x.beginPath(); x.arc(cx - 46, cy + u * 0.5, 21, 0, Math.PI * 2); x.fill();

      x.textAlign = 'center';
      let ns = 64;
      x.font = `bold ${ns}px ${F}`;
      while (x.measureText(name).width > 880 && ns > 34) { ns -= 4; x.font = `bold ${ns}px ${F}`; }
      x.fillStyle = '#f7f3e9';
      x.fillText(name, W / 2, 520);

      x.fillStyle = '#c9a227';
      x.font = `bold 185px ${F}`;
      x.fillText(`${rated}/${total}`, W / 2, 730);
      x.fillStyle = '#cfe0d5';
      x.font = `bold 38px ${F}`;
      x.fillText('SA GOLF COURSES RATED & PLAYED', W / 2, 800);

      rr(x, 160, 860, 760, 22, 11);
      x.fillStyle = 'rgba(247,243,233,.22)'; x.fill();
      const pw = Math.max(22, Math.min(760, (rated / total) * 760));
      rr(x, 160, 860, pw, 22, 11);
      x.fillStyle = '#c9a227'; x.fill();

      if (badgeCount > 0) {
        x.fillStyle = '#cfe0d5';
        x.font = `bold 40px ${F}`;
        x.fillText(`🏅 ${badgeCount} badge${badgeCount === 1 ? '' : 's'} earned`, W / 2, 990);

        const pills = badgeNames.slice(0, 3);
        x.font = `bold 34px ${F}`;
        const padX = 34, gap = 18, ph = 66;
        const widths = pills.map((b) => x.measureText(b).width + padX * 2);
        const totalW = widths.reduce((s, w) => s + w, 0) + gap * (pills.length - 1);
        let px = (W - totalW) / 2;
        for (let i = 0; i < pills.length; i++) {
          rr(x, px, 1030, widths[i], ph, 33);
          x.fillStyle = '#c9a227'; x.fill();
          x.fillStyle = '#0e2f21';
          x.fillText(pills[i], px + widths[i] / 2, 1074);
          px += widths[i] + gap;
        }
      }

      if (bestCourse) {
        x.fillStyle = '#cfe0d5';
        x.font = `36px ${F}`;
        x.fillText('Top of my card', W / 2, 1250);
        let bs = 56;
        x.font = `bold ${bs}px ${F}`;
        while (x.measureText(bestCourse.name).width > 900 && bs > 34) { bs -= 4; x.font = `bold ${bs}px ${F}`; }
        x.fillStyle = '#f7f3e9';
        x.fillText(bestCourse.name, W / 2, 1325);
        x.fillStyle = '#c9a227';
        x.font = `bold 46px ${F}`;
        x.fillText(`★ ${Number(bestCourse.overall).toFixed(2)}`, W / 2, 1395);
      }

      x.fillStyle = '#f7f3e9';
      x.font = `bold 48px ${F}`;
      x.fillText("What's YOUR number?", W / 2, 1580);
      x.fillStyle = '#c9a227';
      x.font = `bold 58px ${F}`;
      x.fillText('pinhigh.co.za', W / 2, 1665);
      x.fillStyle = '#cfe0d5';
      x.font = `34px ${F}`;
      x.fillText('Golf courses, ranked by golfers — not panels', W / 2, 1725);

      const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
      const file = new File([blob], 'pinhigh-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        setNote('Shared!');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pinhigh-card.png';
        a.click();
        setNote('Card downloaded — post it anywhere.');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setNote('Could not create the card — try again.');
    }
    setBusy(false);
  }

  return (
    <span>
      <button className="btn btn-gold" onClick={share} disabled={busy} style={{ marginTop: 12 }}>
        {busy ? 'Creating…' : '📲 Share my card'}
      </button>
      {note && <span className="notice" style={{ marginLeft: 10 }}>{note}</span>}
    </span>
  );
}
