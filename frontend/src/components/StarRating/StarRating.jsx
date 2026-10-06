export default function StarRating({ rating, count, size = 14 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = Math.min(1, Math.max(0, rating - (i - 1)));
    stars.push(
      <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#ccc" />
        </svg>
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="var(--clr-star)" />
        </svg>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {stars}
      {count !== undefined && (
        <span style={{ color: 'var(--clr-blue-link)', fontSize: size, cursor: 'pointer' }}>
          {count.toLocaleString()}
        </span>
      )}
    </span>
  );
}
