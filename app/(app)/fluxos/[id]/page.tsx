import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlowCanvas } from "./flow-canvas";

export const dynamic = "force-dynamic";

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: flow } = await supabase.from("flows").select("id,name").eq("id", id).maybeSingle();
  if (!flow) notFound();

  const [{ data: nodes }, { data: edges }] = await Promise.all([
    supabase.from("flow_nodes").select("node_key,x,y,title,descr,color").eq("flow_id", id),
    supabase.from("flow_edges").select("source_key,target_key").eq("flow_id", id),
  ]);

  return (
    <FlowCanvas
      flowId={id}
      name={flow.name as string}
      initialNodes={((nodes ?? []) as Record<string, unknown>[]).map((n) => ({
        key: n.node_key as string,
        x: Number(n.x),
        y: Number(n.y),
        title: n.title as string,
        desc: n.descr as string,
        color: n.color as string,
      }))}
      initialEdges={((edges ?? []) as Record<string, unknown>[]).map((e) => ({
        source: e.source_key as string,
        target: e.target_key as string,
      }))}
    />
  );
}
