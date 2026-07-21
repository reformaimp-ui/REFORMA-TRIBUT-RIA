import Link from "next/link";

export function BackBar({ href, title, children }: { href: string; title: string; children?: React.ReactNode }) {
  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 22px",
        background: "#fff",
        borderBottom: "1px solid #e7e7e3",
      }}
    >
      <Link
        href={href}
        className="hv-light"
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "#4b4e58",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M10 3L5 8l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );
}
