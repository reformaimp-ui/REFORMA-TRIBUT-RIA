/**
 * Template do portal de pesquisa: remonta a cada navegação, então o
 * conteúdo de cada aba entra com a animação `pageIn` (fade + slide sutil) —
 * mesmo comportamento do grupo (app), ver app/(app)/template.tsx.
 */
export default function PesquisaTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
