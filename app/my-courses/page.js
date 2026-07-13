import { Suspense } from 'react';
import MyCourses from '../../components/MyCourses';

export const metadata = {
  title: 'My course card | Pin High',
  description: 'Your personal record of South African golf — which courses you\'ve rated, and which are still waiting.',
  robots: { index: false },
};

export default function MyCoursesPage() {
  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>Your course card</h1>
          <div className="meta">Every course you&apos;ve rated — and every one still waiting</div>
        </div>
      </section>
      <div className="container">
        <Suspense fallback={null}>
          <MyCourses />
        </Suspense>
      </div>
    </>
  );
}
