"use client";

import * as React from "react";
import { useRef, useEffect, useCallback } from "react";
import { ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // zera antes de medir
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export interface RuixenChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  /** Bloqueia digitação e envio (ex.: enquanto o assistente responde). */
  disabled?: boolean;
  /** Dica exibida à esquerda do rodapé. */
  hint?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

export const RuixenChatInput = React.forwardRef<HTMLTextAreaElement, RuixenChatInputProps>(function RuixenChatInput(
  {
    value,
    onChange,
    onSubmit,
    placeholder = "Digite sua solicitação...",
    disabled = false,
    hint = "Enter envia · Shift + Enter quebra linha",
    className,
    minHeight = 48,
    maxHeight = 150,
  },
  ref,
) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight, maxHeight });
  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, [textareaRef]);

  const canSend = value.trim() !== "" && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSubmit(value.trim());
    onChange("");
    adjustHeight(true);
  };

  // Texto vindo de fora (sugestão clicada, limpeza pós-envio) também remede a altura.
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-line bg-white shadow-sm transition-colors focus-within:border-accent/40",
        disabled && "opacity-70",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          adjustHeight();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full resize-none border-none bg-transparent px-4 pt-3 pb-1 text-[13.5px] leading-[22px] text-ink outline-none",
          "placeholder:text-muted/80 disabled:cursor-not-allowed",
        )}
        style={{ minHeight, overflowY: "auto" }}
      />

      <div className="flex items-center justify-between gap-3 p-3 pt-1">
        <span className="select-none text-[11px] text-muted/80">{hint}</span>

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Enviar mensagem"
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            canSend
              ? "cursor-pointer bg-accent text-white hover:bg-accent-hover"
              : "cursor-not-allowed bg-[#f0f0ed] text-muted",
          )}
        >
          <ArrowUpIcon className="h-4 w-4" />
          <span className="sr-only">Enviar</span>
        </button>
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------
// Chips de atalho (fileira abaixo do campo)
// ----------------------------------------------------------------------
export interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function QuickAction({ icon, label, onClick, disabled }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[#4b4e58] transition-colors",
        "hover:border-[#d8d8d4] hover:bg-paper hover:text-ink",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <span className="text-muted">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default RuixenChatInput;
