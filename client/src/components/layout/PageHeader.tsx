interface PageHeaderProps {
  greeting?: string;
  name?: string;
  subtitle?: string;
}

export function PageHeader({ greeting, name, subtitle }: PageHeaderProps) {
  return (
    <div>
      {greeting && (
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--gvx-text-primary, #222222)", marginBottom: "4px" }}>
          {greeting}{name ? `, ${name}` : ""}
        </h1>
      )}
      {subtitle && (
        <p style={{ fontSize: "13px", color: "var(--gvx-text-secondary, #6F6F6B)", marginBottom: "32px" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
