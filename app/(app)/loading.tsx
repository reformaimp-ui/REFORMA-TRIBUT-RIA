export default function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 240 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#8a8d98", fontSize: 12.5 }}>
        <span
          style={{
            width: 16,
            height: 16,
            border: "2px solid #e2e2de",
            borderTopColor: "#4653d6",
            borderRadius: 99,
            display: "inline-block",
            animation: "spin .7s linear infinite",
          }}
        />
        Carregando…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
