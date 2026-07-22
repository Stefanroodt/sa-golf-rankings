import Link from 'next/link';
import RankingsExplorer from '../components/RankingsExplorer';
import PlayedProgress from '../components/PlayedProgress';
import PrizeBanner from '../components/PrizeBanner';
import InstallApp from '../components/InstallApp';
import Onboarding from '../components/Onboarding';
import NumberBanner from '../components/NumberBanner';
import { getRankings, getRecentRatings, getTopReviewers, PROVINCES, provinceSlug } from '../lib/server';

export const revalidate = 60;

export default async function Home() {
  const [courses, recent, reviewers] = await Promise.all([
    getRankings(), getRecentRatings(), getTopReviewers(),
  ]);

  return (
    <>
      <Onboarding />
      <section className="hero">
        <div className="container">
          <h1>Golf courses, ranked by golfers.</h1>
          <p>
            Who decides which courses are the best? Around here, you do. Every
            position on this list comes from golfers who&apos;ve actually played the
            course — and you&apos;ve got opinions of your own. Which are your
            favourites? Rate them and have your say.
          </p>
          <Link href="/scorecard" className="hero-scorecard">📋 Scorecard</Link>
          <Link href="/rate" className="hero-rate">Rate a course now ★</Link>
          <Link href="/19th-holes" className="hero-nineteenth">
            Best 19th Holes ⛳
          </Link>
          <div><InstallApp className="hero-install" label="📲 Get the app" /></div>
        </div>
      </section>

      <div className="container">
        <NumberBanner />
        <PrizeBanner />
        <PlayedProgress />
        <div className="province-links">
          {PROVINCES.map((p) => (
            <Link key={p} href={`/province/${provinceSlug(p)}`}>{p}</Link>
          ))}
          <Link href="/province/mauritius">Mauritius 🏝️</Link>
        </div>

        <RankingsExplorer courses={courses} provinces={PROVINCES} />

        {(recent.length > 0 || reviewers.length > 0) && (
          <div className="activity-grid" style={{ margin: '6px 0 48px' }}>
            {recent.length > 0 && (
              <div className="card">
                <h2>Recently rated</h2>
                {recent.map((r, i) => (
                  <div className="review" key={i}>
                    <span className="who">
                      <Link href={`/course/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>
                        {r.courses.name}
                      </Link>
                      <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(Math.round(r.overall))}</span>
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
                <p className="notice" style={{ marginTop: 10 }}>
                  <Link href="/leaderboard" style={{ textDecoration: 'underline' }}>
                    Full badges leaderboard →
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
