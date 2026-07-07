'use client';

import { useState } from 'react';

export default function ShareButtons({ name, slug }) {
  const [copied, setCopied] = useState(false);
  const url = `https://sa-golf-rankings.vercel.app/course/${slug}`;
  const text = `Rate ${name} on FairwayRank ZA — SA golf courses ranked by golfers`;

  return (
    <div className="share-row">
      <button
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className="btn" href={`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer">X</a>
    </div>
  );
}
