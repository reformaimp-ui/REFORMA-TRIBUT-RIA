"use client";

import { useRef } from "react";

/**
 * Atrasa a abertura de um popover de "clique único" para não abrir junto com
 * o duplo clique da linha (que entra em modo de edição) — sem isso, o
 * primeiro clique do duplo clique já dispararia o popover antes do dblclick
 * ser reconhecido pelo navegador.
 */
export function useSingleClickOpen(setOpen: (v: boolean) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClick = () => {
    timer.current = setTimeout(() => {
      setOpen(true);
      timer.current = null;
    }, 220);
  };

  const onDoubleClick = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return { onClick, onDoubleClick };
}
