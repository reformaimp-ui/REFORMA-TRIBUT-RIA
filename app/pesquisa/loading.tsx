import { Spinner } from "@/components/app/Spinner";

/**
 * Fallback do Suspense automático do App Router para o grupo /pesquisa —
 * sem isso, o Next segura a navegação em branco até a página terminar de
 * buscar os dados (sessão + consultas ao Supabase), o que parece travado.
 * Com este arquivo, o clique no menu troca a tela na hora, mostrando o
 * spinner enquanto a próxima aba carrega em segundo plano.
 */
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
