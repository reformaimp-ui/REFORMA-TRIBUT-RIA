"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Compartilha o estado "há edição pendente" entre as tabelas da aba IBS/CBS
 * (que abrem edição inline linha a linha) e a barra de abas (que navega para
 * Dados/Produtos/Serviços/Árvore/Grupos/Assistente). Enquanto alguma tabela
 * estiver com uma linha em edição, a navegação entre abas fica bloqueada até
 * o usuário salvar ou descartar.
 */
type Guard = {
  dirty: boolean;
  setDirty: (v: boolean) => void;
  requestNav: (fn: () => void) => void;
};

const Ctx = createContext<Guard | null>(null);

export function IbsEditGuardProvider({ children }: { children: React.ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const requestNav = useCallback((fn: () => void) => {
    if (dirtyRef.current) {
      window.alert("Você tem uma edição não salva. Clique em “Atualizar” ou “Descartar” antes de sair desta aba.");
      return;
    }
    fn();
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return <Ctx.Provider value={{ dirty, setDirty, requestNav }}>{children}</Ctx.Provider>;
}

export function useIbsEditGuard(): Guard {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIbsEditGuard deve ser usado dentro de IbsEditGuardProvider");
  return ctx;
}
