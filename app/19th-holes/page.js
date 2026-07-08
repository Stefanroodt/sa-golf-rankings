import RankingsExplorer from '../../components/RankingsExplorer';
import { getRankings, PROVINCES } from '../../lib/server';

export const revalidate = 60;

export const metadata = {
  title: 'The best 19th holes in South Africa — ranked by golfers | Pin High',
  description:
    'South Africa\'s clubhouse bars and halfway houses, ranked by golfers. Atmosphere, drinks, food, view and service — rated by the people who drink there.',
  alternates: { canonical: '/19th-holes' },
  openGraph: { title: 'The best 19th holes in South Africa — ranked by golfers', url: '/19th-holes' },
};

export default async function NineteenthHoles() {
  const venues = await getRankings(undefined, 'nineteenth_rankings');

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>The best 19th holes in South Africa.</h1>
          <p>
            The round is only half the story. Rate the clubhouse bars and
            halfway houses of SA — atmosphere, drinks, food, view and service —
            and crown the country&apos;s greatest 19th hole.
          </p>
        </div>
      </section>
      <div className="container">
        <RankingsExplorer courses={venues} provinces={PROVINCES} kind="nineteenth" />
      </div>
    </>
  );
}
