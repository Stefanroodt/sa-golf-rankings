import Link from 'next/link';

export const metadata = {
  title: 'PAIA manual | Pin High',
  description:
    'Pin High\'s manual in terms of section 51 of the Promotion of Access to Information Act, 2 of 2000 (PAIA).',
  alternates: { canonical: '/paia' },
};

export default function PaiaPage() {
  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>PAIA manual</h1>
          <div className="meta">
            Section 51 manual — Promotion of Access to Information Act, 2 of 2000
          </div>
        </div>
      </section>
      <div className="container">
        <article className="post-body">
          <h2>1. About this manual</h2>
          <p>
            This manual is published in terms of section 51 of the Promotion of
            Access to Information Act, 2 of 2000 (PAIA), read with the
            Protection of Personal Information Act, 4 of 2013 (POPIA), for Pin
            High (pinhigh.co.za), a South African golf course rating community
            (&quot;the private body&quot;).
          </p>

          <h2>2. Contact details</h2>
          <p>
            Head of the private body and Information Officer: Stefan Roodt<br />
            Email: stefan@pinhigh.co.za<br />
            Website: https://pinhigh.co.za
          </p>

          <h2>3. The Regulator&apos;s guide</h2>
          <p>
            A guide on how to use PAIA, compiled by the Information Regulator
            in terms of section 10 of PAIA, is available from the Information
            Regulator of South Africa at inforegulator.org.za or
            inforeg@inforegulator.org.za.
          </p>

          <h2>4. Categories of records held</h2>
          <p>
            User account records (email address, display name, authentication
            metadata); user-generated content (course and 19th-hole ratings,
            review comments, photographs, feedback submissions — note that
            ratings, comments and photos are public by design); moderation
            records (content reports, anti-abuse flags, hashed IP data);
            operational records (website analytics in aggregate, service and
            hosting records held by our operators Supabase and Vercel).
          </p>

          <h2>5. Records available without a PAIA request</h2>
          <p>
            All published site content — course information, rankings, ratings,
            reviews, photos, blog posts, this manual, and our{' '}
            <Link href="/privacy" style={{ textDecoration: 'underline' }}>privacy policy</Link>{' '}
            — is freely accessible on the website.
          </p>

          <h2>6. How to request access to a record</h2>
          <p>
            Requests must be made on Form 2 (prescribed under PAIA, available
            from the Information Regulator), sent to stefan@pinhigh.co.za, and
            must identify the record, the right you seek to protect, and proof
            of identity. Requests about your own personal information are
            handled under POPIA free of charge — in most cases a simple email
            is sufficient and no form is required. Prescribed fees, where
            applicable, follow the PAIA regulations.
          </p>

          <h2>7. Personal information (POPIA)</h2>
          <p>
            The purposes of processing, categories of data subjects, recipients,
            cross-border transfers and security measures are set out in our{' '}
            <Link href="/privacy" style={{ textDecoration: 'underline' }}>privacy policy</Link>,
            which forms part of this manual.
          </p>

          <p className="notice">Last updated July 2026.</p>
        </article>
      </div>
    </>
  );
}
