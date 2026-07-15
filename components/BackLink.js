'use client';

import { useRouter } from 'next/navigation';

export default function BackLink() {
  const router = useRouter();
  return (
    <a
      href="/"
      className="back-link"
      onClick={(e) => {
        // Only ever go back to a page within Pin High. We keep our own
        // trail of in-app pages; browser history can point at an external
        // site (e.g. when arriving from a shared link), which would throw
        // the visitor out of the app entirely.
        try {
          const st = JSON.parse(sessionStorage.getItem('ph-stack') || '[]');
          const here = window.location.pathname + window.location.search;
          while (st.length && st[st.length - 1] === here) st.pop();
          const prev = st[st.length - 1];
          if (prev && prev !== here) {
            e.preventDefault();
            sessionStorage.setItem('ph-stack', JSON.stringify(st));
            router.push(prev);
            return;
          }
        } catch {}
        // No in-app history — the plain href takes them to the rankings.
      }}
    >
      ← Back
    </a>
  );
}
