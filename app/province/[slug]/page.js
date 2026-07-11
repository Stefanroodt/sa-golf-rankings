import Link from 'next/link';
import { notFound } from 'next/navigation';
import RankingsExplorer from '../../../components/RankingsExplorer';
import { getRankings, PROVINCES, provinceSlug, provinceFromSlug } from '../../../lib/server';

export const revalidate = 60;

export function generateStaticParams() {
  return PROVINCES.map((p) => ({ slug: provinceSlug(p) }));
}

export async function generateMetadata({ params }) {
  const province = provinceFromSlug(params.slug);
  if (!province) return {};
  return {
    title: `Best golf courses in ${province} — ranked by golfers | Pin High`,
    description: `Every GolfRSA-affiliated golf course in ${province}, ranked by ratings from everyday golfers. See rankings for value, conditions, greens, layout, halfway house and staff.`,
    alternates: { canonical: `/province/${params.slug}` },
    openGraph: {
      title: `Best golf courses in ${province} — ranked by golfers`,
      url: `/province/${params.slug}`,
    },
  };
}

export default async function ProvincePage({ params }) {
  const province = provinceFromSlug(params.slug);
  if (!province) notFound();
  const courses = await getRankings(province);

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best golf courses in ${province}, ranked by golfers`,
    itemListElement: courses.slice(0, 20).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      url: `https://pinhigh.co.za/course/${c.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <section className="course-head">
        <div className="container">
          <Link href="/" className="back-link">← All of South Africa</Link>
          <h1>Best golf courses in {province}</h1>
          <div className="meta">
            {courses.length} courses, ranked by golfer ratings
          </div>
        </div>
      </section>
      <div className="container" style={{ paddingTop: 8 }}>
        <div className="province-links">
          {PROVINCES.filter((p) => p !== province).map((p) => (
            <Link key={p} href={`/province/${provinceSlug(p)}`}>{p}</Link>
          ))}
        </div>
        <RankingsExplorer courses={courses} provinces={PROVINCES} hideProvinceFilter />
      </div>
    </>
  );
}
