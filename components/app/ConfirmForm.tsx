"use client";

/**
 * Wrapper de <form> que pede confirmação (window.confirm) antes de submeter —
 * usado em toda ação de excluir para evitar clique acidental. Client Component
 * porque onSubmit não pode ser passado de um Server Component, mas a `action`
 * (Server Action) continua vindo normalmente via prop.
 */
export function ConfirmForm({
  action,
  message,
  children,
  ...rest
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: React.ReactNode;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit">) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </form>
  );
}
