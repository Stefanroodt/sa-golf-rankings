import Link from 'next/link';

export const metadata = {
  title: 'Monthly rating draw | Pin High',
  description:
    'Every course or 19th-hole rating you add on Pin High is an entry into the monthly prize draw. Rate more, win more.',
  alternates: { canonical: '/draw' },
};

export default function DrawPage() {
  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>The monthly rating draw</h1>
          <div className="meta">Rate courses, win golf balls. That&apos;s it.</div>
        </div>
      </section>
      <div className="container">
        <article className="post-body">
          <p>
            Every rating you submit on Pin High — a course or a 19th hole — is
            one entry into that month&apos;s draw. Rate five courses, get five
            entries. At the end of the month we draw one winner, who gets{' '}
            <strong>a dozen Titleist Pro V1s</strong>.
          </p>
          <p>
            <Link href="/rate" className="btn btn-gold">Rate a course now →</Link>
          </p>
          <h2>The small print</h2>
          <p>
            One entry per rating, counted per calendar month (updating an existing
            rating doesn&apos;t add an entry — new courses do). The winner is drawn at
            random in the first week of the following month and contacted on their
            account email, and announced (first name only) on our social channels.
            Ratings flagged by our anti-gaming checks don&apos;t count as entries.
            Open to South African residents; the prize can&apos;t be exchanged for
            cash. Pin High staff — all one of us — can&apos;t win. No purchase
            necessary; rating is free. We may substitute a prize of equal or
            greater value. By entering you accept these terms.
          </p>
        </article>
      </div>
    </>
  );
}
