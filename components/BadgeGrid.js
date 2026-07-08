export default function BadgeGrid({ badges }) {
  return (
    <div className="badge-grid">
      {badges.map((b) => {
        const done = b.have >= b.goal;
        return (
          <div key={b.name} className={`badge-tile${done ? ' earned' : ''}`}>
            <span className="badge-medal">{done ? '★' : '☆'}</span>
            <strong>{b.name}</strong>
            <span className="badge-desc">{b.desc}</span>
            <span className="badge-progress">
              {done ? 'Earned' : `${Math.min(b.have, b.goal)}/${b.goal}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
