'use client';

import { useRouter } from 'next/navigation';

export default function BackLink() {
  const router = useRouter();
  return (
    <a
      href="/"
      className="back-link"
      onClick={(e) => {
        // If the visitor navigated here from within Pin High, go back to
        // where they actually were; otherwise fall through to the rankings.
        const hops = Number(sessionStorage.getItem('ph-nav') || 0);
        if (hops > 1 && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      ← Back
    </a>
  );
}
