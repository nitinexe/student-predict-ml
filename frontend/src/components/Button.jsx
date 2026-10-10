
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  ...props
}) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (href?.startsWith("/")) {
    return (
      <Link to={href} className={classes} {...props}>
        {children}
        {variant === "primary" && (
          <ArrowUpRight size={17} aria-hidden="true" />
        )}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
      {variant === "primary" && (
        <ArrowUpRight size={17} aria-hidden="true" />
      )}
    </button>
  );
}