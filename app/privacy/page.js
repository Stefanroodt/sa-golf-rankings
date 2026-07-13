import Link from 'next/link';

export const metadata = {
  title: 'Privacy policy | Pin High',
  description:
    'How Pin High collects, uses and protects your personal information, in line with South Africa\'s Protection of Personal Information Act (POPIA).',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>Privacy policy</h1>
          <div className="meta">POPIA notice — last updated July 2026</div>
        </div>
      </section>
      <div className="container">
        <article className="post-body">
          <p>
            Pin High (pinhigh.co.za) is a South African golf course rating
            community. This notice explains what personal information we
            collect, why, and your rights under the Protection of Personal
            Information Act, 4 of 2013 (POPIA). The responsible party is Pin
            High, and the Information Officer can be contacted at{' '}
            <strong>stefan@pinhigh.co.za</strong> or via the feedback button on
            our homepage.
          </p>

          <h2>What we collect and why</h2>
          <p>
            When you create an account: your email address, a display name you
            choose, and — if you sign in with Google — your name as provided by
            Google. We use these to operate your account, show your display
            name beside your ratings, and contact you about your account or
            prize draws you have entered. When you rate, comment or upload
            photos: that content, linked to your account. Ratings and comments
            are public by design — that is the purpose of the site. When you
            submit a rating we also store a one-way hashed (unreadable) version
            of your IP address, used solely to detect attempts to game the
            rankings with multiple accounts. We do not store readable IP
            addresses with your ratings.
          </p>
          <p>
            We use privacy-respecting analytics (Vercel Analytics) to count
            page views; it does not use cookies or track you across other
            sites. Essential login state is kept in your browser so you stay
            signed in.
          </p>

          <h2>What we do not do</h2>
          <p>
            We do not sell your personal information, send third-party
            marketing, or share your details with golf clubs or advertisers.
            Your email address is never shown publicly.
          </p>

          <h2>Where your information lives</h2>
          <p>
            Our database and hosting providers are Supabase and Vercel, whose
            servers are located outside South Africa (Europe and the United
            States). By using the site you consent to this cross-border storage
            as permitted by section 72 of POPIA; both providers apply security
            safeguards consistent with laws substantially similar to POPIA.
          </p>

          <h2>How long we keep it</h2>
          <p>
            For as long as you have an account. Public contributions (ratings,
            comments, photos) remain until you delete them or your account is
            deleted, at which point they are permanently removed.
          </p>

          <h2>Your rights</h2>
          <p>
            Under POPIA you may ask us to confirm what personal information we
            hold about you, correct it, or delete it (including your whole
            account). You can update or delete your own ratings and photos on
            the site at any time; for anything else, email{' '}
            <strong>stefan@pinhigh.co.za</strong> and we will respond within a
            reasonable time. Records can also be requested under PAIA — see our{' '}
            <Link href="/paia" style={{ textDecoration: 'underline' }}>PAIA manual</Link>. If
            you believe we have mishandled your information, you may complain
            to the Information Regulator of South Africa
            (inforegulator.org.za).
          </p>

          <h2>Children</h2>
          <p>
            The site is intended for golfers 18 and older. We do not knowingly
            collect personal information from children.
          </p>

          <h2>Changes</h2>
          <p>
            If this policy changes materially, we will note it here with a new
            date. Continued use of the site after changes means you accept the
            updated policy.
          </p>

          <p style={{ marginTop: 28 }}>
            <Link href="/" className="btn">Back to the rankings →</Link>
          </p>
        </article>
      </div>
    </>
  );
}
