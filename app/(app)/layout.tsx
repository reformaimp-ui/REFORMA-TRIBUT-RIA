import { getContext } from "@/lib/data";
import { Sidebar } from "@/components/app/Sidebar";
import { Header } from "@/components/app/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { office, member, members } = await getContext();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar office={office} member={member} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header members={members} />
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>{children}</div>
      </main>
    </div>
  );
}
