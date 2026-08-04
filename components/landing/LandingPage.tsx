"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Landing page pública (rota "/").
 * Portada do design "Imperform Landing" — mantém os tokens do sistema
 * (#4653D6 / #F4F4F2 / #1C1E26) e as fontes já carregadas no root layout.
 */
export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Revela os blocos conforme entram na viewport (uma vez só).
  useEffect(() => {
    const targets = rootRef.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!targets?.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    targets.forEach((el) => io.observe(el));

    // Rede de segurança: nada fica invisível se o observer não disparar.
    const fallback = window.setTimeout(() => {
      targets.forEach((el) => el.classList.add("is-in"));
    }, 1800);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div ref={rootRef} className="lp" style={{ background: "#F4F4F2", overflowX: "hidden" }}>
      {/* ===== HEADER ===== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(244,244,242,0.82)",
          backdropFilter: "saturate(1.2) blur(10px)",
          borderBottom: "1px solid #E7E7E3",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "0 clamp(20px,5vw,44px)",
            height: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <a href="#top" style={{ display: "flex", alignItems: "center", color: "#1C1E26" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imperform-logo.svg"
              alt="Imperform"
              style={{ height: 52, width: "auto", display: "block" }}
            />
          </a>

          {/* Nav completa acima de 860px; abaixo disso o CSS troca pelo botão de menu. */}
          <nav className="lp-desktop" style={{ alignItems: "center", gap: 30 }}>
            <a href="#buscar" className="lp-nav">
              Pesquisar
            </a>
            <a href="#ia" className="lp-nav">
              Assistente IA
            </a>
            <a href="#timeline" className="lp-nav">
              Reforma 2023–33
            </a>
          </nav>
          <div className="lp-desktop" style={{ alignItems: "center", gap: 18 }}>
            <Link href="/login" className="lp-nav">
              Entrar
            </Link>
            <Link href="/cadastro" className="lp-cta">
              Criar conta
            </Link>
          </div>

          <button
            className="lp-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {menuOpen && (
          <div
            className="lp-mobile-menu"
            style={{
              borderTop: "1px solid #E7E7E3",
              background: "#F4F4F2",
              padding: "14px clamp(20px,5vw,44px) 20px",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <a href="#buscar" onClick={closeMenu} className="lp-nav-mobile">
              Pesquisar
            </a>
            <a href="#ia" onClick={closeMenu} className="lp-nav-mobile">
              Assistente IA
            </a>
            <a href="#timeline" onClick={closeMenu} className="lp-nav-mobile">
              Reforma 2023–33
            </a>
            <Link href="/login" onClick={closeMenu} className="lp-nav-mobile">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              onClick={closeMenu}
              className="lp-cta"
              style={{ marginTop: 10, textAlign: "center", padding: 12 }}
            >
              Criar conta
            </Link>
          </div>
        )}
      </header>

      <div id="top" />

      {/* ===== HERO ===== */}
      <section
        id="buscar"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(52px,7vw,96px) clamp(20px,5vw,44px) clamp(40px,5vw,64px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(340px,100%),1fr))",
            gap: "clamp(36px,5vw,72px)",
            alignItems: "center",
          }}
        >
          <div data-reveal className="lp-reveal">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "#4653D6",
                background: "#4653D614",
                border: "1px solid #4653D629",
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "#4653D6",
                  borderRadius: 2,
                  transform: "rotate(45deg)",
                }}
              />
              EC 132/2023 · IBS · CBS · IMPOSTO SELETIVO
            </div>
            <h1
              style={{
                fontSize: "clamp(34px,4.6vw,54px)",
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
                fontWeight: 700,
                margin: "22px 0 0",
                textWrap: "balance",
              }}
            >
              Descubra como a Reforma Tributária afeta o seu produto.
            </h1>
            <p
              style={{
                fontSize: "clamp(16px,1.5vw,19px)",
                lineHeight: 1.55,
                color: "#5B5F6B",
                margin: "20px 0 0",
                maxWidth: 520,
                textWrap: "pretty",
              }}
            >
              Digite o nome do produto ou o NCM e veja a tributação de IBS, CBS e Imposto Seletivo —
              com um assistente que explica o resultado em português claro.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 32 }}>
              <Link href="/cadastro" className="lp-btn-primary">
                Pesquisar tributação agora
              </Link>
              <a href="#ia" className="lp-btn-secondary">
                Ver o assistente de IA
              </a>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 22px",
                marginTop: 26,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12.5,
                color: "#8A8D98",
              }}
            >
              <span>› Sem custo para consultar</span>
              <span>› Fontes oficiais citadas</span>
              <span>› Atualizado conforme a LC 214/2025</span>
            </div>
          </div>

          {/* Mock do produto: busca */}
          <div data-reveal className="lp-reveal">
            <div
              style={{
                background: "#fff",
                border: "1px solid #E7E7E3",
                borderRadius: 14,
                boxShadow:
                  "0 24px 48px -30px rgba(28,30,38,0.28),0 2px 6px -2px rgba(28,30,38,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom: "1px solid #E7E7E3",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5B5F6B" }}>
                  Pesquisar tributação
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 11,
                    color: "#0E7A6F",
                    background: "#0E7A6F14",
                    padding: "4px 9px",
                    borderRadius: 6,
                  }}
                >
                  ANO-TESTE 2026
                </span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid #4653D629",
                    borderRadius: 10,
                    padding: "11px 13px",
                    background: "#4653D608",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4653D6"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16.5" y1="16.5" x2="21" y2="21" />
                  </svg>
                  <span style={{ fontSize: 13, color: "#1C1E26" }}>café torrado em grãos</span>
                  <span className="lp-caret" />
                </div>

                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #E7E7E3",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div className="lp-mock-row">
                    <span style={{ fontSize: 13, color: "#8A8D98" }}>NCM</span>
                    <span className="lp-mono-value">0901.21.00</span>
                  </div>
                  <div className="lp-mock-row">
                    <span style={{ fontSize: 13, color: "#8A8D98" }}>CST</span>
                    <span className="lp-mono-value">000 · Tributação integral</span>
                  </div>
                  <div className="lp-mock-row" style={{ background: "#4653D608" }}>
                    <span style={{ fontSize: 13, color: "#8A8D98" }}>
                      IBS{" "}
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10 }}>
                        (2026)
                      </span>
                    </span>
                    <span className="lp-mono-value" style={{ fontSize: 14, color: "#4653D6" }}>
                      0,10%
                    </span>
                  </div>
                  <div
                    className="lp-mock-row"
                    style={{ background: "#4653D608", borderBottom: "none" }}
                  >
                    <span style={{ fontSize: 13, color: "#8A8D98" }}>
                      CBS{" "}
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10 }}>
                        (2026)
                      </span>
                    </span>
                    <span className="lp-mono-value" style={{ fontSize: 14, color: "#4653D6" }}>
                      0,90%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 13,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 11,
                    color: "#8A8D98",
                  }}
                >
                  ref. LC 214/2025 · exemplo ilustrativo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== IA ===== */}
      <section
        id="ia"
        style={{
          background: "#fff",
          borderTop: "1px solid #E7E7E3",
          borderBottom: "1px solid #E7E7E3",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(56px,7vw,104px) clamp(20px,5vw,44px)",
          }}
        >
          <div data-reveal className="lp-reveal" style={{ maxWidth: 640 }}>
            <div className="lp-eyebrow">Assistente de IA</div>
            <h2 className="lp-h2">Pergunte em português. Receba a resposta com a fonte.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5B5F6B", margin: "14px 0 0" }}>
              Nada de tabelas intermináveis: descreva o produto ou faça a pergunta, e o assistente
              aponta o enquadramento certo — sempre citando a base legal.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
              gap: 20,
              marginTop: 44,
            }}
          >
            {/* pergunta em linguagem natural */}
            <div data-reveal className="lp-reveal lp-panel">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span className="lp-badge" style={{ background: "#4653D6" }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3 L14.3 9 L21 11 L14.3 13 L12 19 L9.7 13 L3 11 L9.7 9 Z" />
                  </svg>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5B5F6B" }}>
                  Pergunta ao assistente
                </span>
              </div>
              <div className="lp-quote">
                &ldquo;Minha empresa revende equipamentos médicos importados. Qual a alíquota de
                IBS/CBS a partir de 2027?&rdquo;
              </div>
              <div
                style={{
                  marginTop: 10,
                  background: "#fff",
                  border: "1px solid #E7E7E3",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 14, lineHeight: 1.55, color: "#1C1E26" }}>
                  Equipamentos médicos têm redução de 60% na alíquota de IBS e CBS, conforme regime
                  específico da LC 214/2025 — reduzindo a carga combinada nesses itens.
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 11,
                    color: "#4653D6",
                  }}
                >
                  fonte: LC 214/2025, art. 168–169
                </div>
              </div>
            </div>

            {/* classificação automática */}
            <div data-reveal className="lp-reveal lp-panel">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span className="lp-badge" style={{ background: "#0E7A6F" }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <path d="M8 12 L11 15 L16 9" />
                  </svg>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5B5F6B" }}>
                  Classificação automática
                </span>
              </div>
              <div className="lp-quote">
                &ldquo;Barra de cereal com cobertura de chocolate, 30g, embalagem
                individual&rdquo;
              </div>
              <div
                style={{
                  marginTop: 10,
                  background: "#fff",
                  border: "1px solid #E7E7E3",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div className="lp-mock-row">
                  <span style={{ fontSize: 13, color: "#8A8D98" }}>NCM sugerido</span>
                  <span className="lp-mono-value" style={{ fontWeight: 600, color: "#0E7A6F" }}>
                    1904.20.00
                  </span>
                </div>
                <div className="lp-mock-row" style={{ borderBottom: "none" }}>
                  <span style={{ fontSize: 13, color: "#8A8D98" }}>Confiança</span>
                  <span className="lp-mono-value" style={{ fontWeight: 600 }}>
                    92%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section
        id="timeline"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(48px,6vw,88px) clamp(20px,5vw,44px)",
        }}
      >
        <div data-reveal className="lp-reveal" style={{ maxWidth: 640 }}>
          <div className="lp-eyebrow">Transição 2023 → 2033</div>
          <h2 className="lp-h2">Saiba exatamente em que fase a reforma está.</h2>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5B5F6B", margin: "14px 0 0" }}>
            A carga tributária do seu produto muda ano a ano. Acompanhe cada etapa.
          </p>
        </div>

        <div data-reveal className="lp-reveal" style={{ marginTop: 44, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 7,
              left: 6,
              right: 6,
              height: 2,
              background: "linear-gradient(90deg,#E7E7E3,#4653D6 55%,#0E7A6F)",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 20,
              overflowX: "auto",
              paddingBottom: 8,
              scrollbarWidth: "thin",
            }}
          >
            {TIMELINE.map((step) =>
              step.current ? (
                <div key={step.year} style={{ flex: "1 1 180px", minWidth: 180, position: "relative" }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: "#4653D6",
                      border: "3px solid #F4F4F2",
                      borderRadius: 3,
                      transform: "rotate(45deg)",
                      marginBottom: 21,
                      boxShadow: "0 0 0 4px #4653D61f",
                    }}
                  />
                  <div
                    style={{
                      background: "#4653D60d",
                      border: "1px solid #4653D629",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginTop: -4,
                    }}
                  >
                    <div className="lp-year" style={{ color: "#4653D6" }}>
                      {step.year}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "#4653D6" }}>
                      {step.title}
                    </div>
                    <div
                      style={{ fontSize: 13.5, lineHeight: 1.5, color: "#5B5F6B", marginTop: 5 }}
                    >
                      {step.text}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={step.year} style={{ flex: "1 1 180px", minWidth: 180 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      background: step.dot,
                      border: "3px solid #F4F4F2",
                      borderRadius: 3,
                      transform: "rotate(45deg)",
                      marginBottom: 22,
                    }}
                  />
                  <div className="lp-year">{step.year}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#8A8D98", marginTop: 5 }}>
                    {step.text}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        style={{
          background: "#fff",
          borderTop: "1px solid #E7E7E3",
          borderBottom: "1px solid #E7E7E3",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(56px,7vw,104px) clamp(20px,5vw,44px)",
          }}
        >
          <div data-reveal className="lp-reveal" style={{ maxWidth: 640 }}>
            <div className="lp-eyebrow">O que você encontra</div>
            <h2 className="lp-h2">Uma pesquisa completa, sem depender de planilha.</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(258px,1fr))",
              gap: 18,
              marginTop: 44,
            }}
          >
            {FEATURES.map((feature) => (
              <div key={feature.title} data-reveal className="lp-reveal lp-feature">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${feature.color}14`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={feature.color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: "16px 0 0" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "#8A8D98", margin: "7px 0 0" }}>
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section
        id="demo"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(48px,6vw,88px) clamp(20px,5vw,44px)",
        }}
      >
        <div
          data-reveal
          className="lp-reveal"
          style={{
            background: "#4653D6",
            borderRadius: 18,
            padding: "clamp(40px,5vw,64px) clamp(28px,5vw,64px)",
            textAlign: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <svg
            width="220"
            height="220"
            viewBox="0 0 36 40"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", right: -40, top: -30, opacity: 0.12 }}
          >
            <path d="M6 22 L18 10 L30 22" stroke="#fff" />
            <path d="M6 29 L18 17 L30 29" stroke="#fff" />
            <path d="M6 36 L18 24 L30 36" stroke="#fff" />
          </svg>
          <h2
            style={{
              fontSize: "clamp(26px,3.2vw,40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              position: "relative",
            }}
          >
            Pesquise a tributação do seu produto agora.
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.82)",
              margin: "16px auto 0",
              maxWidth: 480,
              position: "relative",
            }}
          >
            Sem cadastro complicado. Digite o produto e veja o resultado em segundos.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
              marginTop: 30,
              position: "relative",
            }}
          >
            <Link href="/cadastro" className="lp-btn-invert">
              Criar conta gratuita
            </Link>
            <Link href="/login" className="lp-btn-ghost">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: "#fff", borderTop: "1px solid #E7E7E3" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(44px,5vw,64px) clamp(20px,5vw,44px) 32px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 32,
            }}
          >
            <div style={{ gridColumn: "span 1", minWidth: 200 }}>
              <a href="#top" style={{ display: "flex", alignItems: "center", color: "#1C1E26" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/imperform-logo.svg"
                  alt="Imperform"
                  style={{ height: 44, width: "auto", display: "block" }}
                />
              </a>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "#8A8D98",
                  margin: "14px 0 0",
                  maxWidth: 240,
                }}
              >
                Pesquisa de tributação com IA para a Reforma Tributária brasileira.
              </p>
            </div>
            <div>
              <div className="lp-foot-title">Produto</div>
              <div className="lp-foot-links">
                <a href="#buscar" className="lp-foot-link">
                  Pesquisar tributação
                </a>
                <a href="#ia" className="lp-foot-link">
                  Assistente de IA
                </a>
                <a href="#timeline" className="lp-foot-link">
                  Linha do tempo da reforma
                </a>
              </div>
            </div>
            <div>
              <div className="lp-foot-title">Acesso</div>
              <div className="lp-foot-links">
                <Link href="/login" className="lp-foot-link">
                  Entrar
                </Link>
                <Link href="/cadastro" className="lp-foot-link">
                  Criar conta
                </Link>
                <Link href="/esqueci-senha" className="lp-foot-link">
                  Recuperar senha
                </Link>
              </div>
            </div>
            <div>
              <div className="lp-foot-title">Empresa</div>
              <div className="lp-foot-links">
                <a href="#buscar" className="lp-foot-link">
                  Sobre
                </a>
                <a href="#demo" className="lp-foot-link">
                  Contato
                </a>
                <a href="#demo" className="lp-foot-link">
                  Privacidade · LGPD
                </a>
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #E7E7E3",
              marginTop: 40,
              paddingTop: 22,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12,
                color: "#B7B7B1",
              }}
            >
              © {new Date().getFullYear()} Imperform · Todos os direitos reservados
            </div>
            <div style={{ fontSize: 12, color: "#B7B7B1", maxWidth: 520, textAlign: "right" }}>
              O Imperform organiza informações com base na legislação vigente e não substitui
              consultoria tributária.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const TIMELINE = [
  {
    year: "2023",
    title: "Promulgação",
    text: "EC 132/2023 aprovada. Nascem IBS, CBS e o Imposto Seletivo.",
    dot: "#5B5F6B",
    current: false,
  },
  {
    year: "2025",
    title: "Regulamentação",
    text: "LC 214/2025 define regras, alíquotas de referência e regimes específicos.",
    dot: "#5B5F6B",
    current: false,
  },
  {
    year: "2026",
    title: "Ano-teste",
    text: "Alíquota simbólica de 1% — CBS 0,9% + IBS 0,1% — para calibrar o sistema.",
    dot: "#4653D6",
    current: true,
  },
  {
    year: "2027",
    title: "CBS integral",
    text: "CBS substitui PIS/Cofins e o Imposto Seletivo entra em vigor.",
    dot: "#4653D6",
    current: false,
  },
  {
    year: "2029–32",
    title: "Transição do IBS",
    text: "ICMS e ISS são reduzidos gradualmente enquanto o IBS avança.",
    dot: "#0E7A6F",
    current: false,
  },
  {
    year: "2033",
    title: "Regime pleno",
    text: "IBS e CBS plenos. Extinção definitiva de ICMS e ISS.",
    dot: "#0E7A6F",
    current: false,
  },
];

const FEATURES = [
  {
    title: "Busca por produto ou NCM",
    text: "Descrição livre ou código — o resultado traz NCM, CST e cClassTrib aplicáveis.",
    color: "#4653D6",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </>
    ),
  },
  {
    title: "Assistente de IA",
    text: "Pergunte em português e receba a resposta com a base legal citada.",
    color: "#8A4FD3",
    icon: <path d="M12 3 L14.3 9 L21 11 L14.3 13 L12 19 L9.7 13 L3 11 L9.7 9 Z" />,
  },
  {
    title: "Classificação automática",
    text: "Descreva o produto e receba o NCM/CST sugerido, com grau de confiança.",
    color: "#0E7A6F",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        <polyline points="8,12 11,15 16,9" />
      </>
    ),
  },
  {
    title: "Histórico de consultas",
    text: "Toda pesquisa fica salva — volte a ela quando precisar, sem refazer o trabalho.",
    color: "#1D6FB8",
    icon: (
      <>
        <path d="M12 4 L20 8 L20 16 L12 20 L4 16 L4 8 Z" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </>
    ),
  },
];
