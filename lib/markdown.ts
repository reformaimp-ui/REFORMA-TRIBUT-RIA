/**
 * Mini-renderer de markdown para o preview live (sem dependências).
 * O input é escapado antes de qualquer transformação — seguro para
 * usar com dangerouslySetInnerHTML.
 * Suporta: # ## ###, **negrito**, *itálico*, `código`, [link](url),
 * listas - e 1., > citação, --- e parágrafos.
 */
export function mdToHtml(src: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  const lines = esc(src).split(/\r?\n/);
  let html = "";
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) { closeLists(); const n = h[1].length; html += `<h${n}>${inline(h[2])}</h${n}>`; continue; }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeLists(); html += "<hr/>"; continue; }
    const ul = line.match(/^[-*]\s+(.*)/);
    if (ul) { if (inOl) { html += "</ol>"; inOl = false; } if (!inUl) { html += "<ul>"; inUl = true; } html += `<li>${inline(ul[1])}</li>`; continue; }
    const ol = line.match(/^\d+[.)]\s+(.*)/);
    if (ol) { if (inUl) { html += "</ul>"; inUl = false; } if (!inOl) { html += "<ol>"; inOl = true; } html += `<li>${inline(ol[1])}</li>`; continue; }
    const bq = line.match(/^&gt;\s?(.*)/);
    if (bq) { closeLists(); html += `<blockquote>${inline(bq[1])}</blockquote>`; continue; }
    if (!line.trim()) { closeLists(); continue; }
    closeLists();
    html += `<p>${inline(line)}</p>`;
  }
  closeLists();
  return html;
}
