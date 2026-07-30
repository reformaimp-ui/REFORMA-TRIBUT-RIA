"use server";

import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";

// Cap alto o bastante para o volume de um escritório sem paginação — mesmo
// padrão usado em analise/page.tsx para agregações em memória.
const EVENTS_CAP = 5000;

export type SearchClientMetrics = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  ai_enabled: boolean;
  last_active_at: string | null;
  produtos: number;
  servicos: number;
  lote: number;
  ia: number;
};

export type SearchMetricsTotals = { produto: number; servico: number; lote: number; ia: number };

export async function fetchSearchMetrics(): Promise<{ totals: SearchMetricsTotals; rows: SearchClientMetrics[] }> {
  const { office } = await getContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: events }] = await Promise.all([
    supabase.from("search_clients").select("id,name,email,active,ai_enabled,last_active_at").eq("office_id", office.id).order("name"),
    supabase
      .from("search_events")
      .select("search_client_id,kind")
      .eq("office_id", office.id)
      .order("created_at", { ascending: false })
      .limit(EVENTS_CAP),
  ]);

  const totals: SearchMetricsTotals = { produto: 0, servico: 0, lote: 0, ia: 0 };
  const countsByClient: Record<string, SearchMetricsTotals> = {};
  for (const e of events ?? []) {
    const kind = e.kind as keyof SearchMetricsTotals;
    totals[kind] += 1;
    if (e.search_client_id) {
      countsByClient[e.search_client_id] ??= { produto: 0, servico: 0, lote: 0, ia: 0 };
      countsByClient[e.search_client_id][kind] += 1;
    }
  }

  const rows: SearchClientMetrics[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    active: c.active,
    ai_enabled: c.ai_enabled,
    last_active_at: c.last_active_at,
    produtos: countsByClient[c.id]?.produto ?? 0,
    servicos: countsByClient[c.id]?.servico ?? 0,
    lote: countsByClient[c.id]?.lote ?? 0,
    ia: countsByClient[c.id]?.ia ?? 0,
  }));

  return { totals, rows };
}
