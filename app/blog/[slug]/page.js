import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS, getPost } from '../../../lib/posts';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | Pin High`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, url: `/blog/${post.slug}`, type: 'article' },
  };
}

export default function Post({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    url: `https://pinhigh.co.za/blog/${post.slug}`,
    publisher: { '@type': 'Organization', name: 'Pin High', url: 'https://pinhigh.co.za' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="course-head">
        <div className="container">
          <Link href="/blog" className="back-link">← All posts</Link>
          <h1>{post.title}</h1>
        </div>
      </section>
      <div className="container">
        <article className="post-body">
          {post.body.map((b, i) =>
            b.h ? <h2 key={i}>{b.h}</h2> : <p key={i}>{b.p}</p>
          )}
          <p style={{ marginTop: 28 }}>
            <Link href="/" className="btn">See the rankings →</Link>
          </p>
        </article>
      </div>
    </>
  );
}
