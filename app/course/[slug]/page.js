import Link from 'next/link';
import { notFound } from 'next/navigation';
import RatePanel from '../../../components/RatePanel';
import ShareButtons from '../../../components/ShareButtons';
import ReportButton from '../../../components/ReportButton';
import PhotoUpload from '../../../components/PhotoUpload';
import PhotoReportButton from '../../../components/PhotoReportButton';
import { getCourse, getRatings, getPhotos, photoUrl } from '../../../lib/server';
import { CATEGORIES, CATEGORIES19 } from '../../../lib/supabase';

export const revalidate = 0; // always fresh

export async function generateMetadata({ params }) {
  const course = await getCourse(params.slug);
  if (!course) return {};
  const description =
    course.description ||
    `${course.name} in ${course.town}, ${course.province}: ratings and reviews from everyday golfers on value, conditions, layout, clubhouse and staff.`;
  return {
    title: `${course.name} — golfer reviews & ratings | Pin High`,
    description,
    alternates: { canonical: `/course/${params.slug}` },
    openGraph: {
      title: `${course.name} — golfer reviews & ratings`,
      description,
      url: `/course/${params.slug}`,
    },
  };
}

export default async function CoursePage({ params }) {
  const course = await getCourse(params.slug);
  if (!course) notFound();
  const [ratings, ratings19, photos] = await Promise.all([
    getRatings(course.id),
    getRatings(course.id, 'nineteenth_ratings'),
    getPhotos(course.id),
  ]);

  const avg = (key) =>
    ratings.length ? ratings.reduce((s, r) => s + Number(r[key]), 0) / ratings.length : 0;
  const avg19 = (key) =>
    ratings19.length ? ratings19.reduce((s, r) => s + Number(r[key]), 0) / ratings19.length : 0;

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    `${course.name} ${course.town} South Africa`
  )}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GolfCourse',
    name: course.name,
    description: course.description || undefined,
    url: `https://pinhigh.co.za/course/${course.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: course.town,
      addressRegion: course.province,
      addressCountry: 'ZA',
    },
    ...(ratings.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avg('overall').toFixed(2),
        bestRating: '5',
        worstRating: '1',
        ratingCount: ratings.length,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="course-head">
        <div className="container">
          <Link href="/" className="back-link">← Back to rankings</Link>
          <h1>{course.name}</h1>
          <div className="meta">
            {course.town}, {course.province}
            {course.designer ? ` · Designed by ${course.designer}` : ''} · {course.access}
            {course.holes ? ` · ${course.holes} holes` : ''}
          </div>
        </div>
      </section>

      <div className="container two-col">
        <div>
          <div className="card">
            <h2>About</h2>
            <p style={{ fontSize: 14 }}>
              {course.description ||
                'No description yet — know this course? Add a rating and tell fellow golfers about it in your comment.'}
            </p>
            <p className="notice">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                View on Google Maps ↗
              </a>
              {course.website && (
                <>
                  {' · '}
                  <a href={course.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                    Course website ↗
                  </a>
                </>
              )}
            </p>
          </div>

          <div className="card">
            <h2>
              Golfer ratings{' '}
              <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>
                ({ratings.length} rating{ratings.length === 1 ? '' : 's'})
              </span>
            </h2>
            {ratings.length === 0 && (
              <p className="notice">No ratings yet — be the first to rate this course.</p>
            )}
            {ratings.length > 0 &&
              CATEGORIES.map(({ key, label }) => (
                <div className="cat-row" key={key}>
                  <span className="cat-label">{label}</span>
                  <div className="cat-bar">
                    <div className="cat-fill" style={{ width: `${(avg(key) / 5) * 100}%` }} />
                  </div>
                  <span className="cat-val">{avg(key).toFixed(1)}</span>
                </div>
              ))}
          </div>

          <div className="card">
            <h2>
              The 19th hole{' '}
              <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>
                ({ratings19.length} rating{ratings19.length === 1 ? '' : 's'})
              </span>
            </h2>
            {ratings19.length === 0 && (
              <p className="notice">
                How&apos;s the vibe after the round? Be the first to rate this 19th hole.
              </p>
            )}
            {ratings19.length > 0 &&
              CATEGORIES19.map(({ key, label }) => (
                <div className="cat-row" key={key}>
                  <span className="cat-label">{label}</span>
                  <div className="cat-bar">
                    <div className="cat-fill" style={{ width: `${(avg19(key) / 5) * 100}%` }} />
                  </div>
                  <span className="cat-val">{avg19(key).toFixed(1)}</span>
                </div>
              ))}
            {ratings19.filter((r) => r.comment).map((r) => (
              <div className="review" key={r.id}>
                <span className="who">
                  {r.display_name}
                  <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(Math.round(r.overall))}</span>
                </span>
                <p>{r.comment}</p>
              </div>
            ))}
          </div>

          {photos.length > 0 && (
            <div className="card">
              <h2>Photos</h2>
              <div className="photo-grid">
                {photos.map((p) => (
                  <figure key={p.id}>
                    <img src={photoUrl(p.path)} alt={`${course.name} — photo by ${p.display_name}`} loading="lazy" />
                    <figcaption>
                      {p.display_name}
                      <PhotoReportButton photoId={p.id} />
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {ratings.some((r) => r.comment) && (
            <div className="card">
              <h2>What golfers say</h2>
              {ratings.filter((r) => r.comment).map((r) => (
                <div className="review" key={r.id}>
                  <span className="who">
                    {r.display_name}
                    <span className="stars" style={{ marginLeft: 8 }}>{'★'.repeat(r.overall)}</span>
                    <span className="when">
                      {new Date(r.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <p>{r.comment}</p>
                  <ReportButton ratingId={r.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <RatePanel course={course} />
          <RatePanel
            course={course}
            kind="nineteenth"
            categories={CATEGORIES19}
            title="Rate the 19th hole"
          />
          <PhotoUpload courseId={course.id} />
          <div className="card">
            <h2>Share this course</h2>
            <ShareButtons name={course.name} slug={course.slug} />
          </div>
        </div>
      </div>
    </>
  );
}
