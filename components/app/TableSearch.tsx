"use client";

export function TableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div style={{ position: "relative", width: 260, maxWidth: "100%" }}>
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#a0a3ad", pointerEvents: "none" }}
      >
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        className="fc"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          fontSize: 12,
          padding: "7px 12px 7px 30px",
          borderRadius: 8,
          border: "1px solid #e2e2de",
          outline: "none",
          background: "#fafaf8",
        }}
      />
      {value ? (
        <div
          onClick={() => onChange("")}
          className="hv-gray"
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#a0a3ad", cursor: "pointer", padding: 3, lineHeight: 1 }}
        >
          ✕
        </div>
      ) : null}
    </div>
  );
}
