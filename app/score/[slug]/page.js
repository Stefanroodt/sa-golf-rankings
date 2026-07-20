import Link from 'next/link';
import { notFound } from 'next/navigation';
import Scorecard from '../../../components/Scorecard';
import { getCourse, getScorecard } from '../../../lib/server';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const course = await getCourse(params.slug);
  if (!course) return {};
  return {
    title: `Score your round — ${course.name} | Pin High`,
    robots: { index: false },
  };
}

export default async function ScorePage({ params }) {
  const course = await getCourse(params.slug);
  if (!course) notFound();
  const scorecard = await getScorecard(course.id);

  return (
    <div className="container score-wrap">
      <Link href="/scorecard" className="back-link" style={{ display: 'inline-block', marginBottom: 14 }}>
        ← All scorecards
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 2 }}>{course.name}</h1>
      <div className="meta-sub" style={{ marginBottom: 16 }}>
        {course.town}, {course.province}
      </div>
      <Scorecard course={course} scorecard={scorecard} autoOpen />
    </div>
  );
}
