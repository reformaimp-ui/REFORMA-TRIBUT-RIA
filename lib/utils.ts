/**
 * Junta classes condicionais (mesma assinatura do `cn` do shadcn, sem depender
 * de clsx/tailwind-merge — o projeto usa Tailwind de forma pontual e não tem
 * classes conflitantes vindas de props externas).
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
