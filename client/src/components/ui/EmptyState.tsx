interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  subtext?: string;
}

export function EmptyState({ icon, message, subtext }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        className="rounded-full p-3"
        style={{
          border: "1px solid var(--gvx-border-strong, #DEDEDA)",
          color: "var(--gvx-text-muted, #A8A8A3)",
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: "var(--gvx-text-sm, 13px)", color: "var(--gvx-text-secondary, #6F6F6B)" }}>
        {message}
      </p>
      {subtext && (
        <p style={{ fontSize: "var(--gvx-text-xs, 11px)", color: "var(--gvx-text-muted, #A8A8A3)" }}>
          {subtext}
        </p>
      )}
    </div>
  );
}
