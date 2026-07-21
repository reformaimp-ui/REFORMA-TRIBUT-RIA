"use client";

import { useRouter } from "next/navigation";

export function ClientFilterSelect({
  clients,
  pessoa,
  cliente,
}: {
  clients: { id: string; name: string }[];
  pessoa: string;
  cliente: string;
}) {
  const router = useRouter();
  return (
    <select
      value={cliente}
      onChange={(e) => {
        const qp = new URLSearchParams();
        if (pessoa !== "all") qp.set("pessoa", pessoa);
        if (e.target.value !== "all") qp.set("cliente", e.target.value);
        router.push(qp.toString() ? `/tarefas?${qp}` : "/tarefas");
      }}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        background: "#f4f4f2",
        padding: "8px 28px 8px 13px",
        borderRadius: 99,
        border: "1.5px solid #e2e2de",
        color: "#4b4e58",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="all">Todos os clientes</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
