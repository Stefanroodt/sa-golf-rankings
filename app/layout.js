import './globals.css';
import Nav from '../components/Nav';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  metadataBase: new URL('https://pinhigh.co.za'),
  title: 'Pin High — South Africa\'s golf courses, ranked by golfers',
  description:
    'South African golf course rankings powered entirely by ratings from everyday golfers. Rate the courses you\'ve played and shape the list.',
  alternates: { canonical: '/' },
  openGraph: {
    siteName: 'Pin High',
    type: 'website',
    locale: 'en_ZA',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Pin High — golf courses, ranked by golfers' }],
  },
  twitter: { card: 'summary_large_image' },
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Pin High',
  url: 'https://pinhigh.co.za',
  description:
    'South African golf course rankings powered entirely by ratings from everyday golfers.',
  publisher: {
    '@type': 'Organization',
    name: 'Pin High',
    url: 'https://pinhigh.co.za',
    logo: 'https://pinhigh.co.za/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <div className="page">
          <Nav />
          <main>{children}</main>
          <footer>
            <div className="footer-links">
              <a href="/">Rankings</a>
              <a href="/19th-holes">19th Holes</a>
              <a href="/blog">Blog</a>
              <a href="/about">About</a>
            </div>
            Pin High — rankings decided by golfers, not panels.
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
