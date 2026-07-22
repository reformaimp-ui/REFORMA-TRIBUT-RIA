export function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        flex: "1 1 46%",
        maxWidth: 560,
        background: "#12131a",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
        color: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(#ffffff14 1.2px, transparent 1.2px)",
          backgroundSize: "26px 26px",
          opacity: 0.6,
        }}
      />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Imperform" width={20} height={20} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-.01em" }}>Imperform</div>
      </div>
      <div style={{ position: "relative", maxWidth: 400 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.22,
            letterSpacing: "-.02em",
            textWrap: "pretty",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "#b7b9c4",
            lineHeight: 1.65,
            marginTop: 16,
            textWrap: "pretty",
          }}
        >
          {subtitle}
        </div>
      </div>
      <div style={{ position: "relative", display: "flex" }}>
        <div style={{ paddingRight: 22, borderRight: "1px solid #ffffff22" }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "var(--font-jetbrains)" }}>
            2026→33
          </div>
          <div style={{ fontSize: 11, color: "#8d8fa0", marginTop: 4 }}>Período de transição</div>
        </div>
        <div style={{ padding: "0 22px", borderRight: "1px solid #ffffff22" }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "var(--font-jetbrains)" }}>
            CBS·IBS·IS
          </div>
          <div style={{ fontSize: 11, color: "#8d8fa0", marginTop: 4 }}>Novos tributos</div>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "var(--font-jetbrains)" }}>
            NCM · CST
          </div>
          <div style={{ fontSize: 11, color: "#8d8fa0", marginTop: 4 }}>
            Pesquisa de tributação por produto
          </div>
        </div>
      </div>
    </div>
  );
}
