function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function isSameSiteUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return host === "rizkiramadhan.biz.id";
  } catch {
    return false;
  }
}

function toWhatsAppHref(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (!digits.startsWith("62")) digits = `62${digits}`;
  return `https://wa.me/${digits}`;
}

function splitTrailingPunctuation(value: string): {
  core: string;
  trailing: string;
} {
  let core = value;
  let trailing = "";
  while (/[.,;:!?)]$/.test(core)) {
    trailing = `${core.slice(-1)}${trailing}`;
    core = core.slice(0, -1);
  }
  return { core, trailing };
}

function linkifyUrls(text: string): string {
  return text.replace(/https?:\/\/[^\s<]+/gi, (raw) => {
    const { core, trailing } = splitTrailingPunctuation(raw);
    if (!core) return raw;

    const href = core.replaceAll("&amp;", "&");
    const sameSite = isSameSiteUrl(href);
    const attrs = sameSite
      ? `href="${escapeAttr(href)}" class="agent-message-link"`
      : `href="${escapeAttr(href)}" class="agent-message-link" target="_blank" rel="noopener noreferrer"`;

    return `<a ${attrs}>${core}</a>${trailing}`;
  });
}

function linkifyPhones(text: string): string {
  return text.replace(
    /(?<![\w+])(?:\+62|62|0)8[\d-]{7,14}\d(?![\w-])/g,
    (phone) => {
      const href = toWhatsAppHref(phone);
      return `<a href="${escapeAttr(href)}" class="agent-message-link" target="_blank" rel="noopener noreferrer">${phone}</a>`;
    },
  );
}

function mapTextOutsideTags(html: string, map: (text: string) => string): string {
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith("<") ? part : map(part)))
    .join("");
}

function linkifyInline(html: string): string {
  return mapTextOutsideTags(html, (text) => linkifyPhones(linkifyUrls(text)));
}

function isMarkdownTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(trimmed);
}

function formatInline(text: string): string {
  const images: string[] = [];
  let result = text.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_match, alt: string, src: string) => {
      const index = images.length;
      images.push(
        `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" class="agent-message-image" loading="lazy" referrerpolicy="no-referrer" />`,
      );
      return `\u0000IMG${index}\u0000`;
    },
  );

  result = escapeHtml(result);
  result = result.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>",
  );
  result = result.replace(/\u0000IMG(\d+)\u0000/g, (_match, index: string) => {
    return images[Number(index)] ?? "";
  });

  return linkifyInline(result);
}

function parseMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
}

function isMarkdownTableRow(line: string): boolean {
  return parseMarkdownTableRow(line).length >= 2;
}

function stripDecorativePipes(line: string): string {
  const cells = parseMarkdownTableRow(line);
  if (cells.length === 1 && line.trim().startsWith("|") && line.trim().endsWith("|")) {
    return cells[0];
  }
  return line;
}

function isMarkdownTableBlock(lines: string[], startIndex: number): boolean {
  if (!isMarkdownTableRow(lines[startIndex])) return false;

  if (
    startIndex + 1 < lines.length &&
    isMarkdownTableSeparator(lines[startIndex + 1])
  ) {
    return true;
  }

  if (
    startIndex + 1 < lines.length &&
    isMarkdownTableRow(lines[startIndex + 1])
  ) {
    const columnCount = parseMarkdownTableRow(lines[startIndex]).length;
    return parseMarkdownTableRow(lines[startIndex + 1]).length === columnCount;
  }

  return false;
}

function formatMarkdownTable(lines: string[], startIndex: number): {
  html: string;
  nextIndex: number;
} {
  const rows: string[][] = [parseMarkdownTableRow(lines[startIndex])];
  let index = startIndex + 1;

  if (index < lines.length && isMarkdownTableSeparator(lines[index])) {
    index += 1;
  }

  while (index < lines.length && isMarkdownTableRow(lines[index])) {
    rows.push(parseMarkdownTableRow(lines[index]));
    index += 1;
  }

  const [header, ...body] = rows;
  const thead = `<thead><tr>${header
    .map((cell) => `<th>${formatInline(cell)}</th>`)
    .join("")}</tr></thead>`;
  const tbody =
    body.length > 0
      ? `<tbody>${body
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => `<td>${formatInline(cell)}</td>`)
                .join("")}</tr>`,
          )
          .join("")}</tbody>`
      : "";

  return {
    html: `<div class="agent-message-table-wrap"><table class="agent-message-table">${thead}${tbody}</table></div>`,
    nextIndex: index,
  };
}

function formatBlock(content: string): string {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(stripDecorativePipes);
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (isMarkdownTableSeparator(line)) {
      index += 1;
      continue;
    }

    if (isMarkdownTableBlock(lines, index)) {
      const table = formatMarkdownTable(lines, index);
      blocks.push(table.html);
      index = table.nextIndex;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        `<h${level} class="agent-message-heading">${formatInline(heading[2])}</h${level}>`,
      );
      index += 1;
      continue;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      blocks.push('<hr class="agent-message-divider">');
      index += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(
          `<li>${formatInline(lines[index].replace(/^[-*+]\s+/, ""))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(
          `<li>${formatInline(lines[index].replace(/^\d+\.\s+/, ""))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^(#{1,6}\s|[-*+]\s|\d+\.\s|```)/.test(lines[index]) &&
      !isMarkdownTableBlock(lines, index) &&
      !isMarkdownTableSeparator(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    if (paragraph.length === 0) {
      index += 1;
      continue;
    }

    blocks.push(
      `<p>${paragraph.map((entry) => formatInline(entry)).join("<br>")}</p>`,
    );
  }

  return blocks.join("");
}

export function formatAgentUserMessageHtml(content: string): string {
  return escapeHtml(content);
}

export function formatAgentMessageHtml(content: string): string {
  const parts = content.split(/(```[\w+-]*\n[\s\S]*?```)/g);

  return parts
    .map((part) => {
      const codeMatch = part.match(/^```([\w+-]*)\n([\s\S]*?)```$/);
      if (!codeMatch) return formatBlock(part);

      const code = escapeHtml(codeMatch[2].trimEnd());
      return `<pre class="agent-message-code"><code>${code}</code></pre>`;
    })
    .join("");
}
