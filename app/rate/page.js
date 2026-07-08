import { Suspense } from 'react';
import QuickRate from '../../components/QuickRate';

export const metadata = {
  title: 'Rate a course | Pin High',
  description:
    'Find any of South Africa\'s 413 golf courses and rate it in 30 seconds — the course, the 19th hole, or both.',
  alternates: { canonical: '/rate' },
};

export default function RatePage() {
  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>Rate a course</h1>
          <div className="meta">
            Search, tap, rate — the course, the 19th hole, or both
          </div>
        </div>
      </section>
      <div className="container">
        <Suspense fallback={null}>
          <QuickRate />
        </Suspense>
      </div>
    </>
  );
}
