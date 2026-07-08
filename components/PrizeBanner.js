import Link from 'next/link';

export default function PrizeBanner() {
  return (
    <Link href="/draw" className="prize-banner">
      <span className="prize-banner-main">
        🏆 Monthly draw: every rating is an entry — win a dozen Pro V1s.
      </span>
      <span className="prize-banner-cta">Details →</span>
    </Link>
  );
}
