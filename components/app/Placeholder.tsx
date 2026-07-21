export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div style={{ padding: 22 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e7e3",
          borderRadius: 12,
          padding: "28px 24px",
          maxWidth: 560,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#8a8d98", lineHeight: 1.6 }}>{note}</div>
      </div>
    </div>
  );
}
