interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
}

export default function StatCard({
  label,
  value,
  detail,
}: StatCardProps) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}