import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  metadataBase: new URL('https://pinhigh.co.za'),
  title: 'Pin High — South Africa\'s golf courses, ranked by golfers',
  description:
    'South African golf course rankings powered entirely by ratings from everyday golfers. Rate the courses you\'ve played and shape the list.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <Nav />
          <main>{children}</main>
          <footer>
            Pin High — rankings decided by golfers, not panels.
          </footer>
        </div>
      </body>
    </html>
  );
}
