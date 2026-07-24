import { Spinner } from "@/components/app/Spinner";

export default function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 240 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#8a8d98", fontSize: 12.5 }}>
        <Spinner size={16} />
        Carregando…
      </div>
    </div>
  );
}
