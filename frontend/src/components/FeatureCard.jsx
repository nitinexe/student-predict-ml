
export default function FeatureCard({
  icon: Icon,
  number,
  title,
  description,
}) {
  return (
    <article className="feature-card">
      <div className="feature-top">
        <span className="feature-icon">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <span className="feature-number">{number}</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}