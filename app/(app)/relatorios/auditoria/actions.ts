"use server";

import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import type { AuditLogRow, AuditFilters } from "./constants";

const PAGE_SIZE = 50;

export async function fetchAuditLog(filters: AuditFilters, page: number) {
  const { office } = await getContext();
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id,actor_member_id,actor_name,table_name,record_id,action,summary,changed_fields,created_at", { count: "exact" })
    .eq("office_id", office.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filters.memberId.length > 0) query = query.in("actor_member_id", filters.memberId);
  if (filters.table.length > 0) query = query.in("table_name", filters.table);
  if (filters.action.length > 0) query = query.in("action", filters.action);
  if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);

  const { data, count } = await query;
  return { rows: (data ?? []) as AuditLogRow[], total: count ?? 0, pageSize: PAGE_SIZE };
}
