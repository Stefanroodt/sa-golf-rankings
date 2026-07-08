// Blog posts. To add a post: append an object here and it appears on /blog
// and in the sitemap automatically.

export const POSTS = [
  {
    slug: 'why-we-built-pin-high',
    title: 'Why we built Pin High: golf rankings without the panels',
    date: '2026-07-07',
    excerpt:
      'Every golf ranking in South Africa is decided by a small panel of raters. We think the 139,000 golfers who actually play these courses every week deserve the vote instead.',
    body: [
      { p: 'Pick up any list of South Africa\'s best golf courses and somewhere in the fine print you\'ll find the same thing: a panel. A few dozen well-travelled raters, scoring courses against criteria you never see, producing a ranking you\'re meant to accept.' },
      { p: 'The panels aren\'t wrong, exactly. Leopard Creek is magnificent. The Links at Fancourt is a masterpiece. But panels have blind spots. They visit on invitation, play in perfect conditions, and get the good table at lunch. They don\'t queue for a Sunday tee time, pay their own green fee, or discover that the halfway house ran out of pies at 11am. The golfer\'s experience of a course — the one that decides whether you go back — is bigger than architecture.' },
      { h: 'One golfer, one vote' },
      { p: 'Pin High ranks all 413 GolfRSA-affiliated courses in the country using ratings from golfers who\'ve actually played them. Six categories: overall, value, conditions, layout, clubhouse and staff. Every rating carries the same weight whether it comes from a scratch golfer or a 24 handicap, because both of them paid the same green fee.' },
      { p: 'The maths behind the list is deliberately humble. A course with one glowing rating doesn\'t leapfrog a course with thirty solid ones — rankings firm up as votes come in, which means every new rating genuinely moves the needle. Early on, your opinion counts for a lot.' },
      { h: 'What we\'re not' },
      { p: 'We\'re not a booking site, we don\'t take money from courses, and no club can pay to move up the list. If a course tops a Pin High ranking, it\'s because golfers put it there. If it props up the bottom, well — golfers put it there too, and the club knows exactly what to fix.' },
      { p: 'So that\'s the pitch. You\'ve got opinions about every course you\'ve ever played — the brilliant ones, the overpriced ones, the hidden gems nobody talks about. Sign up in thirty seconds and put them on the record. The rankings are yours to shape.' },
    ],
  },
  {
    slug: 'how-to-rate-a-golf-course',
    title: 'How to rate a golf course: what our six categories actually mean',
    date: '2026-07-07',
    excerpt:
      'Value, conditions, layout, clubhouse, staff — a quick guide to what each Pin High rating category covers, and how to score like you mean it.',
    body: [
      { p: 'Rating a course on Pin High takes thirty seconds: six categories, one to five stars each, and an optional comment. But the rankings are only as good as the ratings behind them, so here\'s what each category is really asking.' },
      { h: 'Overall' },
      { p: 'Your gut feel for the whole day out. If a mate asked "should I play there?", this is your answer in stars. It\'s the score that drives the main rankings, so make it count — 5 means you\'d cancel plans to play it again, 1 means you want your four hours back.' },
      { h: 'Value' },
      { p: 'Not "was it cheap" — was it worth it. A R1,500 round can be five-star value and a R250 round can be a rip-off. Judge the experience against what you paid.' },
      { h: 'Conditions' },
      { p: 'The course on the day you played it: greens, fairways, tee boxes, bunkers. Be fair — if you played mid-winter or a week after a festival, say so in your comment.' },
      { h: 'Layout' },
      { p: 'The architecture. Variety, strategy, memorability. Could you describe three holes to a friend a month later? That\'s a good layout. Are all the par 4s the same hole in different directions? That\'s not.' },
      { h: 'Clubhouse' },
      { p: 'The halfway house, the 19th, the showers, the deck. South African golf culture lives here — a course with a great bar and a view of the 18th earns its stars honestly.' },
      { h: 'Staff' },
      { p: 'From the bag drop to the pro shop to the beverage cart. Friendly, sharp service turns a good day great; being treated like an inconvenience at your own booking does the opposite.' },
      { h: 'One habit worth building' },
      { p: 'Rate the course within a day or two of playing it, while the details are fresh — and drop one honest sentence in the comment. "Greens were the best I\'ve putted all year" tells the next golfer more than the stars do. One rating per course per golfer, and you can update yours any time your opinion changes. Now go rate the last course you played.' },
    ],
  },
  {
    slug: 'best-19th-holes-south-africa',
    title: 'The search for South Africa\'s best 19th hole starts now',
    date: '2026-07-07',
    excerpt:
      'The round is only half the story. Pin High now ranks SA\'s clubhouse bars and halfway houses — atmosphere, drinks, food, view and service. Nominate yours by rating it.',
    body: [
      { p: 'Ask a golfer about their favourite course and you\'ll hear about a back nine. Ask them about their favourite day of golf, and sooner or later the story ends up at the bar: the ice-cold lager after a 40-degree round in the bushveld, the pie at the halfway house that saved a collapsing card, the deck where you watched your fourball finish 18 in the sunset.' },
      { p: 'That\'s the 19th hole, and it\'s never had a ranking. Until now.' },
      { h: 'How it works' },
      { p: 'Every course page on Pin High now has a second rating panel for the 19th hole, scored on five things that matter after a round: atmosphere, drinks, food, view and service — plus your overall verdict. The votes build a separate national leaderboard at pinhigh.co.za/19th-holes, ranked the same way as the courses: by golfers, weighted by volume of votes, immune to marketing budgets.' },
      { p: 'The beauty of this list is that it has nothing to do with course pedigree. A 9-hole country club in the Free State with a legendary bar can outrank a championship estate with a soulless lounge. We suspect a few will.' },
      { h: 'The rules of a great 19th' },
      { p: 'We\'d argue the greats share a few things: beer served properly cold and priced like the club remembers you just paid a green fee; food that arrives fast and tastes like it was made for hungry golfers, not a wedding; a view of golf — ideally the 18th green, so you can heckle incoming fourballs; and staff who ask how you played and mean it.' },
      { p: 'You know the bars that qualify. Go to the course\'s page, scroll to "Rate the 19th hole", and get your favourite on the board. The title of South Africa\'s greatest 19th hole is officially up for grabs.' },
    ],
  },
];

export const getPost = (slug) => POSTS.find((p) => p.slug === slug);
