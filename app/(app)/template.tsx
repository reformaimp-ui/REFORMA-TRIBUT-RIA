/**
 * Template do grupo (app): remonta a cada navegação, então o conteúdo
 * de cada aba entra com a animação `pageIn` (fade + slide sutil).
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
