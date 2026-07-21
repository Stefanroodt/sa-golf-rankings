import Link from 'next/link';
import ScorecardPicker from '../../components/ScorecardPicker';
import MyScores from '../../components/MyScores';
import ScoringStats from '../../components/ScoringStats';
import { getScorecardCourses } from '../../lib/server';

export const revalidate = 300;

export const metadata = {
  title: 'Scorecard — score your round | Pin High',
  description: 'Pick your course and score your round hole by hole on Pin High. Real scorecards for South Africa’s most-played courses.',
  alternates: { canonical: '/scorecard' },
};

export default async function ScorecardHub() {
  const courses = await getScorecardCourses();

  return (
    <>
      <section className="course-head" style={{ paddingBottom: 18 }}>
        <div className="container">
          <Link href="/" className="section-switch">
            <span className="section-switch-title">Course Ratings</span>
            <span className="section-switch-sub">Rate &amp; browse courses</span>
          </Link>
          <h1 style={{ marginTop: 16 }}>📋 My score cards</h1>
          <div className="meta">
            Pick your course and start scoring — {courses.length} courses with full hole-by-hole cards
          </div>
        </div>
      </section>
      <div className="container" style={{ paddingTop: 16 }}>
        <MyScores />
        <ScoringStats />
        <ScorecardPicker courses={courses} />
        <p className="notice" style={{ marginBottom: 40 }}>
          Played somewhere not listed here? Every course on Pin High still lets you log a total score —
          just open it from the <Link href="/" style={{ textDecoration: 'underline' }}>rankings</Link>.
        </p>
      </div>
    </>
  );
}
