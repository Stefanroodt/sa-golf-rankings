import Link from 'next/link';
import { POSTS } from '../../lib/posts';

export const metadata = {
  title: 'Blog | Pin High',
  description:
    'News and notes from Pin High — South Africa\'s golfer-voted course rankings.',
  alternates: { canonical: '/blog' },
};

export default function Blog() {
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <section className="course-head">
        <div className="container">
          <h1>The Pin High blog</h1>
          <div className="meta">Notes from the people&apos;s rankings</div>
        </div>
      </section>
      <div className="container" style={{ margin: '28px auto 60px' }}>
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card blog-item">
            <h2>{p.title}</h2>
            <p className="notice" style={{ margin: '6px 0 0' }}>{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
