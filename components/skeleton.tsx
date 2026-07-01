export function Sk({
  className = "",
  bg,
  style,
}: {
  className?: string;
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: bg ?? "rgba(128,128,128,0.12)", ...style }}
    />
  );
}
