import Link from 'next/link';
import RankingsExplorer from '../components/RankingsExplorer';
import { getRankings, getRecentRatings, getTopReviewers, PROVINCES, provinceSlug } from '../lib/server';

export const revalidate = 60;

export default async function Home() {
  const [courses, recent, reviewers] = await Promise.all([
    getRankings(), getRecentRatings(), getTopReviewers(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>South Africa&apos;s golf courses, ranked by golfers.</h1>
          <p>
            No panels, no politics — every position on this list is decided by
            ratings from people who actually played the course. All {courses.length} GolfRSA-affiliated
            courses are here. Played one? Add your rating.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="province-links">
          {PROVINCES.map((p) => (
            <Link key={p} href={`/province/${provinceSlug(p)}`}>{p}</Link>
          ))}
        </div>

        {(recent.length > 0 || reviewers.length > 0) && (
          <div className="activity-grid">
            {recent.length > 0 && (
              <div className="card">
                <h2>Recently rated</h2>
                {recent.map((r, i) => (
                  <div className="review" key={i}>
                    <span className="who">
                      <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                        {r.courses.name}
                      </Link>
                      <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(r.overall)}</span>
                      <span className="when">by {r.display_name}</span>
                    </span>
                    {r.comment && <p>{r.comment.slice(0, 120)}{r.comment.length > 120 ? '…' : ''}</p>}
                  </div>
                ))}
              </div>
            )}
            {reviewers.length > 0 && (
              <div className="card">
                <h2>Top reviewers</h2>
                {reviewers.map((r, i) => (
                  <div className="review" key={r.name}>
                    <span className="who">
                      {i + 1}. {r.name}
                      <span className="when">{r.n} rating{r.n === 1 ? '' : 's'}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <RankingsExplorer courses={courses} provinces={PROVINCES} />
      </div>
    </>
  );
}
