import type {
  AgentChatMessage,
  AgentCodeBlock,
  AgentHistoryItem,
  AgentPromptCategory,
  AgentPromptRequest,
  AgentPromptResponse,
  AgentWebPreview,
  AgentWebPreviewFiles,
} from "~/types/agent";
import { createAgentPromptClient } from "~/lib/agent/fetch-prompt";
import {
  notifyAgentResponseComplete,
  prepareAgentMessage,
  resolveAgentHistory,
  unlockNotificationAudio,
} from "~/lib/agent/settings";
import { localeToBcp47, resolveLocale } from "~/lib/i18n";

/** Backend rejects history items longer than this (see /api/v1/prompt). */
const MAX_HISTORY_CHARS_PER_ITEM = 4_000;
const MAX_HISTORY_ITEMS = 20;
const HISTORY_CODE_PLACEHOLDER =
  "[Generated code omitted from history to keep follow-up prompts working]";

const CODING_TOPIC_PATTERN =
  /\b(code|coding|program|programming|developer|javascript|typescript|python|react|vue|angular|api|function|bug|error|debug|serverless|html|css|sql|git|deploy|compile|syntax|algorithm|frontend|backend|fullstack|astro|node|npm|docker|database|query|component|class|interface|variable|loop|array|object|json|rest|graphql|webpack|vite|tailwind|cloudflare|worker|typescript|java|golang|rust|php|laravel|nextjs|nuxt|express|fastapi|django|flutter|kotlin|swift|regex|refactor|implementasi|optimasi|arsitektur)\b/i;

const CODE_BLOCK_PATTERN = /```([\w+-]*)\n?([\s\S]*?)```/g;

export function isCodingTopic(message: string): boolean {
  return CODING_TOPIC_PATTERN.test(message);
}

const WEB_PREVIEW_TOPIC_PATTERN =
  /\b(html|css|javascript|jsx|tsx|tailwind|landing|website|webpage|navbar|hero|button|card|component|ui|frontend|responsive|markup|web|halaman|situs|tampilan|layout|styling|desain|design|mockup|template|portofolio|portfolio|agency|agensi|properti|property)\b/i;

export function isWebBuildTopic(message: string): boolean {
  return WEB_PREVIEW_TOPIC_PATTERN.test(message);
}

export function extractCodeBlocks(content: string): AgentCodeBlock[] {
  const blocks: AgentCodeBlock[] = [];
  const pattern = new RegExp(CODE_BLOCK_PATTERN.source, CODE_BLOCK_PATTERN.flags);

  for (const match of content.matchAll(pattern)) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trimEnd(),
    });
  }

  return blocks;
}

function normalizeBlockLanguage(language: string): string {
  return language.toLowerCase().replace(/^language-/, "");
}

function isFullHtmlDocument(code: string): boolean {
  return /<!DOCTYPE\s+html|<html[\s>]/i.test(code);
}

function looksLikeHtmlFragment(code: string): boolean {
  return /<[a-z][\s\S]*>/i.test(code);
}

function extractEmbeddedStyles(html: string): string {
  const styles: string[] = [];

  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const chunk = match[1]?.trim();
    if (chunk) styles.push(chunk);
  }

  return styles.join("\n\n");
}

function extractInlineScripts(html: string): string {
  const scripts: string[] = [];

  for (const match of html.matchAll(
    /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const chunk = match[1]?.trim();
    if (chunk) scripts.push(chunk);
  }

  return scripts.join("\n\n");
}

function stripEmbeddedStyles(html: string): string {
  return html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").trim();
}

function stripInlineScripts(html: string): string {
  return html
    .replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, "")
    .trim();
}

function stripRelativeStylesheetLinks(html: string): string {
  return html
    .replace(
      /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'](?!https?:|\/\/)[^"']+["'])[^>]*\/?>/gi,
      "",
    )
    .trim();
}

function stripRelativeScriptTags(html: string): string {
  return html
    .replace(
      /<script\b(?=[^>]*\bsrc=["'](?!https?:|\/\/)[^"']+["'])[^>]*>\s*<\/script>/gi,
      "",
    )
    .trim();
}

export function splitWebPreviewFiles(parts: {
  html?: string;
  css?: string;
  js?: string;
}): AgentWebPreviewFiles {
  let html = parts.html?.trim() ?? "";
  let css = parts.css?.trim() ?? "";
  let js = parts.js?.trim() ?? "";

  if (!css && html) {
    const embedded = extractEmbeddedStyles(html);
    if (embedded) css = embedded;
  }

  if (!js && html) {
    const embedded = extractInlineScripts(html);
    if (embedded) js = embedded;
  }

  if (css && html) {
    html = stripEmbeddedStyles(html);
    html = stripRelativeStylesheetLinks(html);
  }

  if (js && html) {
    html = stripInlineScripts(html);
    html = stripRelativeScriptTags(html);
  }

  return { html, css, js };
}

function collectPreviewBlocks(content: string): {
  html?: string;
  css?: string;
  js?: string;
} | null {
  const blocks = extractCodeBlocks(content);

  if (blocks.length === 0) {
    if (!looksLikeHtmlFragment(content)) return null;
    return { html: content.trim() };
  }

  const htmlBlock = blocks.find((block) =>
    ["html", "htm"].includes(normalizeBlockLanguage(block.language)),
  );
  const cssBlock = blocks.find(
    (block) => normalizeBlockLanguage(block.language) === "css",
  );
  const jsBlock = blocks.find((block) =>
    ["js", "javascript", "jsx", "tsx"].includes(
      normalizeBlockLanguage(block.language),
    ),
  );

  if (htmlBlock || cssBlock || jsBlock) {
    return {
      html: htmlBlock?.code,
      css: cssBlock?.code,
      js: jsBlock?.code,
    };
  }

  const first = blocks[0];
  if (first && looksLikeHtmlFragment(first.code)) {
    return { html: first.code };
  }

  return null;
}

function buildPreviewSource(files: AgentWebPreviewFiles): string {
  return [
    files.html && `\`\`\`html\n${files.html}\n\`\`\``,
    files.css && `\`\`\`css\n${files.css}\n\`\`\``,
    files.js && `\`\`\`javascript\n${files.js}\n\`\`\``,
  ]
    .filter(Boolean)
    .join("\n\n");
}

const TAILWIND_UTILITY_PATTERN =
  /\b(?:flex|grid|inline-flex|block|hidden|container|rounded(?:-[a-z0-9]+)?|shadow(?:-[a-z0-9]+)?|gap-(?:x-|y-)?\d|p[trblxy]?-\d|m[trblxy]?-\d|w-(?:full|screen|\d+\/\d+|\d+)|h-(?:full|screen|\d+)|(?:min-|max-)?[wh]-\[[^\]]+\]|text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|[a-z]+-\d{3})|bg-(?:[a-z]+-\d{3}|[a-z]+)|border(?:-[a-z0-9]+)?|font-(?:sans|serif|mono|bold|medium|semibold|light)|items-(?:start|center|end|stretch)|justify-(?:start|center|end|between|around)|space-[xy]-\d|object-(?:cover|contain)|aspect-(?:square|video)|overflow-(?:hidden|auto)|z-\d+|top-\d+|left-\d+|right-\d+|bottom-\d+|translate-[xy]-\d+|scale-\d+|opacity-\d+|transition(?:-[a-z]+)?|hover:[a-z0-9_-]+|md:[a-z0-9_-]+|lg:[a-z0-9_-]+)\b/;

const TAILWIND_CDN_SCRIPT =
  '<script src="https://cdn.tailwindcss.com"><\/script>';

function usesTailwindUtilities(markup: string): boolean {
  return TAILWIND_UTILITY_PATTERN.test(markup);
}

function hasTailwindCdn(markup: string): boolean {
  return /cdn\.tailwindcss\.com/i.test(markup);
}

function isAbsoluteResource(href: string): boolean {
  return (
    /^(?:https?:)?\/\//i.test(href) ||
    /^(?:data:|blob:|mailto:|tel:|#)/i.test(href)
  );
}

function resourceBasename(href: string): string {
  return href.split(/[?#]/)[0].split("/").pop() || href;
}

function previewPlaceholderUrl(
  seed: string,
  width = 1200,
  height = 800,
): string {
  const base = seed.replace(/\.[a-z0-9]+$/i, "").trim() || "preview";
  const safe = encodeURIComponent(base.slice(0, 64));
  return `https://picsum.photos/seed/${safe}/${width}/${height}`;
}

function rewriteRelativeUrl(href: string): string {
  const trimmed = href.trim();
  if (!trimmed || isAbsoluteResource(trimmed)) return trimmed;
  return previewPlaceholderUrl(resourceBasename(trimmed));
}

function rewriteSrcset(value: string): string {
  return value
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return trimmed;
      const [url, ...descriptors] = trimmed.split(/\s+/);
      return [rewriteRelativeUrl(url), ...descriptors].join(" ");
    })
    .join(", ");
}

const PREVIEW_IMAGE_FALLBACK_SCRIPT = `<script data-preview-image-fallback>
(function () {
  function placeholder(seed) {
    var safe = encodeURIComponent(String(seed || "preview").slice(0, 64));
    return "https://picsum.photos/seed/" + safe + "/1200/800";
  }
  function harden(img) {
    if (!img || img.tagName !== "IMG" || img.dataset.previewHardened) return;
    img.dataset.previewHardened = "1";
    if (!img.getAttribute("referrerpolicy")) {
      img.setAttribute("referrerpolicy", "no-referrer");
    }
    img.addEventListener("error", function onError() {
      img.removeEventListener("error", onError);
      if (img.dataset.previewFallback) return;
      img.dataset.previewFallback = "1";
      img.src = placeholder(img.getAttribute("alt") || "fallback");
    });
  }
  document.querySelectorAll("img").forEach(harden);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.tagName === "IMG") harden(node);
        else if (node.querySelectorAll) node.querySelectorAll("img").forEach(harden);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
<\/script>`;

function rewriteRelativeMedia(html: string): string {
  let doc = html;

  doc = doc.replace(/<img\b[^>]*>/gi, (tag) => {
    let next = tag.replace(/\bsrc=(["'])([^"']*)\1/i, (_match, q, src) => {
      return `src=${q}${rewriteRelativeUrl(src)}${q}`;
    });
    next = next.replace(/\bsrcset=(["'])([^"']*)\1/i, (_match, q, srcset) => {
      return `srcset=${q}${rewriteSrcset(srcset)}${q}`;
    });
    if (!/\breferrerpolicy=/i.test(next)) {
      next = next.replace(/<img\b/i, '<img referrerpolicy="no-referrer"');
    }
    return next;
  });

  doc = doc.replace(/<source\b[^>]*>/gi, (tag) => {
    let next = tag.replace(/\bsrcset=(["'])([^"']*)\1/i, (_match, q, srcset) => {
      return `srcset=${q}${rewriteSrcset(srcset)}${q}`;
    });
    next = next.replace(/\bsrc=(["'])([^"']*)\1/i, (_match, q, src) => {
      return `src=${q}${rewriteRelativeUrl(src)}${q}`;
    });
    return next;
  });

  doc = doc.replace(
    /\b(?:poster|data-src)=(["'])([^"']*)\1/gi,
    (full, q, src) => {
      if (isAbsoluteResource(src)) return full;
      return full.replace(`${q}${src}${q}`, `${q}${rewriteRelativeUrl(src)}${q}`);
    },
  );

  doc = doc.replace(
    /url\(\s*(['"]?)([^"')]+)\1\s*\)/gi,
    (full, _q, raw) => {
      const href = String(raw).trim();
      if (!href || isAbsoluteResource(href)) return full;
      return `url("${rewriteRelativeUrl(href)}")`;
    },
  );

  return doc;
}

function resolveAssetContent(
  href: string,
  assets: Map<string, string>,
  fallback?: string,
): string | undefined {
  const file = resourceBasename(href);
  if (assets.has(file)) return assets.get(file);
  if (assets.has(href)) return assets.get(href);
  if (assets.size === 1) return [...assets.values()][0];
  return fallback;
}

function buildCssAssetMap(css?: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!css) return map;
  for (const name of ["styles.css", "style.css", "main.css"]) {
    map.set(name, css);
  }
  return map;
}

function buildJsAssetMap(js?: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!js) return map;
  for (const name of ["script.js", "main.js", "app.js", "index.js"]) {
    map.set(name, js);
  }
  return map;
}

function injectBeforeHeadEnd(html: string, snippet: string): string {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `  ${snippet}\n</head>`);
  }
  return html;
}

function injectBeforeBodyEnd(html: string, snippet: string): string {
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `  ${snippet}\n</body>`);
  }
  return `${html}\n${snippet}`;
}

function inlineRelativeAssets(
  html: string,
  assets?: { css?: string; js?: string },
): string {
  let doc = html;
  let inlinedCss = false;
  let inlinedJs = false;
  const cssMap = buildCssAssetMap(assets?.css);
  const jsMap = buildJsAssetMap(assets?.js);

  doc = doc.replace(/<link\b[^>]*\/?>/gi, (tag) => {
    if (!/rel=["']stylesheet["']/i.test(tag)) return tag;

    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) return tag;
    if (isAbsoluteResource(href)) return tag;

    const css = resolveAssetContent(href, cssMap, assets?.css);
    if (!css) return "";

    inlinedCss = true;
    return `<style data-inlined-from="${resourceBasename(href)}">\n${css}\n</style>`;
  });

  doc = doc.replace(
    /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (match, before, src, after) => {
      if (isAbsoluteResource(src)) return match;

      const js = resolveAssetContent(src, jsMap, assets?.js);
      if (!js) return "";

      inlinedJs = true;
      return `<script${before}${after} data-inlined-from="${resourceBasename(src)}">\n${js}\n</script>`;
    },
  );

  if (assets?.css && !inlinedCss) {
    doc = injectBeforeHeadEnd(
      doc,
      `<style data-inlined-from="styles.css">\n${assets.css}\n</style>`,
    );
  }

  if (assets?.js && !inlinedJs) {
    doc = injectBeforeBodyEnd(
      doc,
      `<script data-inlined-from="script.js">\n${assets.js}\n</script>`,
    );
  }

  return doc;
}

function hoistHeadAssets(html: string): { body: string; headAssets: string } {
  const headAssets: string[] = [];
  let body = html;

  body = body.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (match) => {
    headAssets.push(match);
    return "";
  });

  body = body.replace(/<link\b[^>]*\/?>/gi, (match) => {
    if (!/rel=["']stylesheet["']/i.test(match)) return match;

    const href = match.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (href && isAbsoluteResource(href)) {
      headAssets.push(match);
      return "";
    }

    return match;
  });

  return { body: body.trim(), headAssets: headAssets.join("\n  ") };
}

function injectTailwindCdnIntoHead(html: string): string {
  if (!usesTailwindUtilities(html) || hasTailwindCdn(html)) return html;

  if (/<head[\s>]/i.test(html)) {
    return html.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  ${TAILWIND_CDN_SCRIPT}`,
    );
  }

  if (/<html[\s>]/i.test(html)) {
    return html.replace(
      /<html([^>]*)>/i,
      `<html$1>\n<head>\n  ${TAILWIND_CDN_SCRIPT}\n</head>`,
    );
  }

  return html;
}

function preparePreviewDocument(
  html: string,
  assets?: { css?: string; js?: string },
): string {
  if (!isFullHtmlDocument(html)) return html;

  let document = inlineRelativeAssets(html, assets);
  document = rewriteRelativeMedia(document);
  document = injectTailwindCdnIntoHead(document);
  document = injectBeforeBodyEnd(document, PREVIEW_IMAGE_FALLBACK_SCRIPT);
  return document;
}

function composeWebDocument(parts: {
  html?: string;
  css?: string;
  js?: string;
}): string {
  const hoisted = hoistHeadAssets(parts.html ?? "");
  const markup = `${hoisted.body} ${parts.css ?? ""}`;
  const tailwindScript =
    usesTailwindUtilities(markup) && !hasTailwindCdn(hoisted.headAssets)
      ? `\n  ${TAILWIND_CDN_SCRIPT}`
      : "";

  const shell = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>${tailwindScript}
  ${hoisted.headAssets ? `  ${hoisted.headAssets}\n` : ""}  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${hoisted.body}
</body>
</html>`;

  let document = inlineRelativeAssets(shell, { css: parts.css, js: parts.js });
  document = rewriteRelativeMedia(document);
  return injectBeforeBodyEnd(document, PREVIEW_IMAGE_FALLBACK_SCRIPT);
}

function escapePreviewHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function composeCodeOnlyDocument(code: string, language: string): string {
  const safeCode = escapePreviewHtml(code);
  const safeLanguage = escapePreviewHtml(language.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code Preview</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      display: flex;
      flex-direction: column;
    }
    .badge {
      align-self: flex-start;
      margin: 12px 12px 0;
      padding: 4px 10px;
      border: 1px solid #333;
      border-radius: 9999px;
      color: #9cdcfe;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    pre {
      margin: 0;
      padding: 12px;
      overflow: auto;
      white-space: pre;
      line-height: 1.55;
      font-size: 12px;
      flex: 1;
    }
  </style>
</head>
<body>
  <span class="badge">${safeLanguage}</span>
  <pre><code>${safeCode}</code></pre>
</body>
</html>`;
}

export function buildWebPreview(content: string): AgentWebPreview | null {
  const raw = collectPreviewBlocks(content);
  if (!raw) {
    const fallback = extractCodeBlocks(content).find((block) =>
      block.code.trim().length > 0
    );
    if (!fallback) return null;

    const normalizedLanguage = normalizeBlockLanguage(fallback.language) || "code";
    const normalizedCode = fallback.code.trimEnd();

    return {
      title: "Code Preview",
      language: normalizedLanguage,
      source: `\`\`\`${normalizedLanguage}\n${normalizedCode}\n\`\`\``,
      document: composeCodeOnlyDocument(normalizedCode, normalizedLanguage),
      files: {
        html: normalizedCode,
        css: "",
        js: "",
      },
    };
  }

  const files = splitWebPreviewFiles(raw);
  if (!files.html && !files.css && !files.js) return null;

  const document =
    raw.html && isFullHtmlDocument(raw.html)
      ? preparePreviewDocument(raw.html, {
        css: raw.css,
        js: raw.js,
      })
      : composeWebDocument({
        html: raw.html ?? "",
        css: raw.css ?? "",
        js: raw.js ?? "",
      });

  return {
    title: "Web Preview",
    language: "html",
    source: buildPreviewSource(files),
    document,
    files,
  };
}

export function isWebCodingTopic(message: string): boolean {
  return (isCodingTopic(message) || isWebBuildTopic(message)) &&
    WEB_PREVIEW_TOPIC_PATTERN.test(message);
}

export function getCanvasPayload(
  content: string,
): AgentCodeBlock | null {
  const preview = buildWebPreview(content);
  if (!preview) return null;

  return {
    language: preview.language,
    code: preview.source,
  };
}

export function shouldShowCanvas(
  message: string,
  category?: AgentPromptCategory,
  content?: string,
): boolean {
  if (!(category === "programming" || isCodingTopic(message))) return false;
  if (content) return buildWebPreview(content) !== null;
  return isWebCodingTopic(message);
}

export function resolveCanvasPreviewFromMessages(
  messages: AgentChatMessage[],
  defaultCategory?: AgentPromptCategory | null,
): AgentWebPreview | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") continue;

    let userPrompt = "";
    for (let userIndex = index - 1; userIndex >= 0; userIndex -= 1) {
      if (messages[userIndex].role === "user") {
        userPrompt = messages[userIndex].content;
        break;
      }
    }

    const category = message.category ?? defaultCategory ?? undefined;
    if (!shouldShowCanvas(userPrompt, category, message.content)) continue;

    const preview = buildWebPreview(message.content);
    if (preview) return preview;
  }

  return null;
}

export function resolveCanvasMetaFromMessages(
  messages: AgentChatMessage[],
  defaultCategory?: AgentPromptCategory | null,
): {
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
} | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") continue;

    let userPrompt = "";
    for (let userIndex = index - 1; userIndex >= 0; userIndex -= 1) {
      if (messages[userIndex].role === "user") {
        userPrompt = messages[userIndex].content;
        break;
      }
    }

    const category = message.category ?? defaultCategory;
    if (!category) continue;
    if (!shouldShowCanvas(userPrompt, category, message.content)) continue;
    if (!buildWebPreview(message.content)) continue;

    return {
      prompt: userPrompt,
      category,
      model: message.model,
    };
  }

  return null;
}

function compactHistoryContent(content: string): string {
  let compact = content.replace(
    CODE_BLOCK_PATTERN,
    (_match, language: string) =>
      `\`\`\`${language || "text"}\n${HISTORY_CODE_PLACEHOLDER}\n\`\`\``,
  );

  if (compact.length > MAX_HISTORY_CHARS_PER_ITEM) {
    compact =
      compact.slice(0, MAX_HISTORY_CHARS_PER_ITEM - 1).trimEnd() + "…";
  }

  return compact.trim();
}

export function buildPromptHistory(
  messages: AgentChatMessage[],
): AgentHistoryItem[] {
  return messages
    .slice(-MAX_HISTORY_ITEMS)
    .map((message) => ({
      role: message.role,
      content: compactHistoryContent(message.content),
    }))
    .filter((message) => message.content.length > 0);
}

export function formatAgentTime(iso: string): string {
  const locale = resolveLocale(
    typeof document !== "undefined" ? document.documentElement.lang : undefined,
  );
  return new Date(iso).toLocaleTimeString(localeToBcp47(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendAgentPrompt(input: {
  message: string;
  history?: AgentHistoryItem[];
  category: AgentPromptCategory;
  userId?: string;
}): Promise<AgentPromptResponse> {
  // Unlock during the submit gesture so the completion sound can play later.
  unlockNotificationAudio();

  const payload: AgentPromptRequest = {
    message: prepareAgentMessage(input.message),
    category: input.category,
    history: resolveAgentHistory(input.history),
  };

  if (input.userId) {
    payload.user_id = input.userId;
  }

  const response = await createAgentPromptClient(payload);

  notifyAgentResponseComplete({
    category: response.category,
    model: response.model,
    message: input.message,
    reply: response.reply,
  });

  return response;
}
