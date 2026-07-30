import Link from "next/link";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { AuditFilterBar } from "@/components/app/AuditFilterBar";
import { AuditLogTable } from "@/components/app/AuditLogTable";
import { fetchAuditLog } from "./actions";
import type { AuditFilters } from "./constants";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; table?: string; action?: string; from?: string; to?: string; page?: string }>;
}) {
  const { member, members } = await getContext();
  if (member.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const filters: AuditFilters = {
    memberId: sp.member ? sp.member.split(",").filter(Boolean) : [],
    table: sp.table ? sp.table.split(",").filter(Boolean) : [],
    action: sp.action ? sp.action.split(",").filter(Boolean) : [],
    dateFrom: sp.from ?? "",
    dateTo: sp.to ?? "",
  };
  const page = Math.max(1, Number(sp.page) || 1);

  const { rows, total, pageSize } = await fetchAuditLog(filters, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (filters.memberId.length) params.set("member", filters.memberId.join(","));
    if (filters.table.length) params.set("table", filters.table.join(","));
    if (filters.action.length) params.set("action", filters.action.join(","));
    if (filters.dateFrom) params.set("from", filters.dateFrom);
    if (filters.dateTo) params.set("to", filters.dateTo);
    params.set("page", String(p));
    return `/relatorios/auditoria?${params.toString()}`;
  };

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Auditoria</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98" }}>
          Registro automático de criações, edições e exclusões da equipe — {total} evento{total === 1 ? "" : "s"} no total
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
        <AuditFilterBar members={members.map((m) => ({ id: m.id, name: m.name }))} initialFilters={filters} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AuditLogTable rows={rows} />

          {totalPages > 1 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="hv-light" style={{ fontSize: 11.5, fontWeight: 600, color: "#4b4e58", padding: "6px 10px", border: "1px solid #e2e2de", borderRadius: 6 }}>
                  ← Anterior
                </Link>
              ) : null}
              <span style={{ fontSize: 11.5, color: "#8a8d98" }}>
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="hv-light" style={{ fontSize: 11.5, fontWeight: 600, color: "#4b4e58", padding: "6px 10px", border: "1px solid #e2e2de", borderRadius: 6 }}>
                  Próxima →
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
