// Shared badge definitions — used by the profile page and the leaderboard.

export function computeBadges({ n, n19, nPhotos, byProvince, provinceTotals, nFirsts = 0 }) {
  const bestProvince = Object.entries(byProvince).sort((a, b) => b[1] - a[1])[0];
  const badges = [
    { name: 'Opening Drive', desc: 'Rate your first course', have: n, goal: 1 },
    { name: 'Front Nine', desc: 'Rate 9 courses', have: n, goal: 9 },
    { name: 'Back Nine', desc: 'Rate 18 courses', have: n, goal: 18 },
    { name: 'Halfway House', desc: 'Rate 50 courses', have: n, goal: 50 },
    { name: 'Century Club', desc: 'Rate 100 courses', have: n, goal: 100 },
    { name: 'Grand Tour', desc: 'Rate 250 courses', have: n, goal: 250 },
    { name: 'Pioneer', desc: 'Be the first to rate a course', have: nFirsts, goal: 1 },
    { name: 'Trailblazer', desc: 'First to rate 10 courses', have: nFirsts, goal: 10 },
    { name: 'First Round', desc: 'Rate your first 19th hole', have: n19, goal: 1 },
    { name: '19th Hole Regular', desc: 'Rate 10 19th holes', have: n19, goal: 10 },
    { name: 'Clubhouse Legend', desc: 'Rate 25 19th holes', have: n19, goal: 25 },
    { name: 'Snapper', desc: 'Share 5 course photos', have: nPhotos, goal: 5 },
    {
      name: 'Province Explorer',
      desc: 'Rate 10 courses in one province',
      have: bestProvince ? bestProvince[1] : 0,
      goal: 10,
    },
    ...Object.entries(provinceTotals || {}).map(([p, t]) => ({
      name: `${p} Master`,
      desc: `Rate all ${t} courses in ${p}`,
      have: byProvince[p] || 0,
      goal: t,
      quiet: !((byProvince[p] || 0) >= t || (byProvince[p] || 0) >= 10),
    })),
  ];
  return badges.filter((b) => !b.quiet);
}

export const earnedBadges = (badges) => badges.filter((b) => b.have >= b.goal);

export function topBadgeName(badges) {
  const earned = earnedBadges(badges)
    .filter((b) => !b.name.endsWith('Master'))
    .sort((a, b) => b.goal - a.goal);
  const master = earnedBadges(badges).find((b) => b.name.endsWith('Master'));
  return master ? master.name : earned[0]?.name || null;
}
