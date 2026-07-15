import Link from 'next/link';

export const metadata = {
  title: 'About Pin High — how the rankings work',
  description:
    'Pin High ranks every GolfRSA-affiliated golf course in South Africa using ratings from everyday golfers. Here\'s exactly how the rankings are calculated.',
  alternates: { canonical: '/about' },
};

const FAQS = [
  {
    q: 'How are Pin High\'s golf course rankings decided?',
    a: 'Entirely by golfers. Registered users rate courses they have played on six categories — value, course condition, greens, layout, halfway house and staff — from 1 to 5 stars, and the overall score is the average. Rankings are ordered by average overall rating, with ties broken by the number of ratings, and every card shows how many ratings sit behind the score. No panel, no editorial input, and no course can pay to move up.',
  },
  {
    q: 'Which courses are included?',
    a: 'Every GolfRSA-affiliated golf course in South Africa — more than 400 — across all nine provinces — from championship estates to 9-hole country clubs. If a course is missing, use the feedback button on the homepage and we\'ll add it.',
  },
  {
    q: 'Does Pin High cover courses outside South Africa?',
    a: 'Yes — Mauritius, the favourite golf trip for South African golfers. All of the island\'s courses are on the site and can be rated exactly like SA courses, with their own rankings page. Mauritius courses never mix into the South African national rankings, and your SA courses-played number stays a purely South African count.',
  },
  {
    q: 'Who can rate a course?',
    a: 'Any golfer with a free account — sign up with Google, an email link, or an email and password in under a minute. Each golfer gets one rating per course, which they can update at any time. Ratings are screened automatically to stop anyone gaming the rankings with multiple accounts.',
  },
  {
    q: 'What are the 19th hole rankings?',
    a: 'A separate leaderboard for South Africa\'s clubhouse bars and halfway houses, rated on atmosphere, drinks, food, view and service. The 19th hole rankings are independent of course rankings — a modest course with a legendary bar can top the list.',
  },
  {
    q: 'Is the Pin High app safe to install?',
    a: 'Yes. Pin High installs as a web app — it is simply this website on your home screen, with no downloads from unknown sources, no access to your files, contacts or location, and nothing running in the background. On some Android phones the system shows a generic compatibility notice during installation ("built for an older version of Android"); that message comes from how Chrome packages all web apps and is safe to accept with Install anyway.',
  },
  {
    q: 'Does Pin High take money from golf courses?',
    a: 'No. Pin High doesn\'t sell rankings, placements, or reviews. If a course tops a list, golfers put it there.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function About() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="course-head">
        <div className="container">
          <h1>About Pin High</h1>
          <div className="meta">How the people&apos;s rankings work</div>
        </div>
      </section>
      <div className="container">
        <article className="post-body">
          <p>
            Pin High ranks every GolfRSA-affiliated golf course in South Africa —
            more than 400 of them — using ratings from golfers who have actually played
            them. There is no panel and no editorial thumb on the scale: the
            rankings are a live, weighted average of golfer ratings, and they
            move whenever someone adds theirs.
          </p>
          {FAQS.map(({ q, a }) => (
            <div key={q}>
              <h2>{q}</h2>
              <p>{a}</p>
            </div>
          ))}
          <p style={{ marginTop: 28 }}>
            <Link href="/" className="btn">See the rankings →</Link>{' '}
            <Link href="/19th-holes" className="btn btn-gold" style={{ marginLeft: 8 }}>Best 19th holes →</Link>
          </p>
        </article>
      </div>
    </>
  );
}
