import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { getData as getPdfWorkerData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_HTML_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 5;

PDFParse.setWorker(getPdfWorkerData());

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") ||
    normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
    normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.");
}

export async function assertSafeUrl(input: string) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Hanya tautan HTTP atau HTTPS yang dapat disimpan");
  if (url.username || url.password) throw new Error("Tautan dengan kredensial tidak diizinkan");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Alamat jaringan privat tidak dapat diakses");
  }
  return url;
}

async function fetchSafe(url: URL, headers: HeadersInit) {
  let current = url;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeUrl(current.href);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers
    });
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: current };
    const location = response.headers.get("location");
    if (!location) throw new Error("Sumber mengirim redirect tanpa tujuan");
    current = new URL(location, current);
  }
  throw new Error("Sumber mengirim terlalu banyak redirect");
}

export async function fetchBounded(url: URL) {
  const { response, finalUrl } = await fetchSafe(url, { "User-Agent": "Verso/0.1 (+personal knowledge archive)" });
  if (!response.ok) throw new Error(`Sumber merespons dengan status ${response.status}`);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  const max = contentType.includes("pdf") ? MAX_PDF_BYTES : MAX_HTML_BYTES;
  if (declaredSize > max) throw new Error("Ukuran sumber melewati batas Verso");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > max) throw new Error("Ukuran sumber melewati batas Verso");
  return { buffer, contentType, finalUrl };
}

export async function fetchArticleImage(input: string, baseUrl: URL) {
  const url = await assertSafeUrl(new URL(input, baseUrl).href);
  const { response } = await fetchSafe(url, {
    "User-Agent": "Mozilla/5.0 (compatible; Verso/0.1; +personal knowledge archive)",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": baseUrl.href
  });
  if (!response.ok) throw new Error(`Gambar merespons dengan status ${response.status}`);
  const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() ?? "";
  if (contentType === "image/svg+xml" || (contentType && !contentType.startsWith("image/") && contentType !== "application/octet-stream")) {
    throw new Error("Sumber bukan gambar raster");
  }
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_IMAGE_BYTES) throw new Error("Gambar melewati batas 15 MB");
  const inputBuffer = Buffer.from(await response.arrayBuffer());
  if (inputBuffer.byteLength > MAX_IMAGE_BYTES) throw new Error("Gambar melewati batas 15 MB");

  const pipeline = sharp(inputBuffer, { limitInputPixels: 80_000_000 }).rotate();
  const metadata = await pipeline.metadata();
  const output = await pipeline
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width ?? metadata.width ?? null,
    height: output.info.height ?? metadata.height ?? null,
    originalUrl: url.href
  };
}

export function articleImageSources(contentHtml: string, baseUrl: URL) {
  const dom = new JSDOM(`<body>${contentHtml}</body>`, { url: baseUrl.href });
  return Array.from(dom.window.document.body.querySelectorAll("img"))
    .map((image) => image.getAttribute("src"))
    .filter((source): source is string => Boolean(source))
    .map((source) => {
      try { return new URL(source, baseUrl).href; } catch { return null; }
    })
    .filter((source): source is string => source !== null && /^https?:/.test(source));
}

export function attachArchivedImages(contentHtml: string, baseUrl: URL, storagePaths: Map<string, string>) {
  const dom = new JSDOM(`<body>${contentHtml}</body>`, { url: baseUrl.href });
  for (const image of dom.window.document.body.querySelectorAll("img")) {
    const source = image.getAttribute("src");
    if (!source) continue;
    try {
      const path = storagePaths.get(new URL(source, baseUrl).href);
      if (path) image.setAttribute("data-verso-path", path);
    } catch {
      // Invalid image sources stay untouched and remain readable as article text.
    }
  }
  return dom.window.document.body.innerHTML;
}

export function resolveArchivedImages(contentHtml: string, signedUrls: Map<string, string>) {
  const dom = new JSDOM(`<body>${contentHtml}</body>`);
  for (const image of dom.window.document.body.querySelectorAll("img[data-verso-path]")) {
    const path = image.getAttribute("data-verso-path");
    const signedUrl = path ? signedUrls.get(path) : null;
    if (signedUrl) image.setAttribute("src", signedUrl);
    image.removeAttribute("data-verso-path");
  }
  return dom.window.document.body.innerHTML;
}

export async function parsePdf(buffer: Buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = normalizeText(result.text);
    if (!text) throw new Error("PDF tidak memiliki teks yang dapat dipilih");
    return { text, pageCount: result.total };
  } finally {
    await parser.destroy();
  }
}

export function parseArticle(html: string, url: URL) {
  const dom = new JSDOM(html, { url: url.href });
  normalizeArticleAssets(dom.window.document, url);
  const citationPdf = dom.window.document.querySelector('meta[name="citation_pdf_url"]')?.getAttribute("content");
  const citationTitle = dom.window.document.querySelector('meta[name="citation_title"]')?.getAttribute("content")?.trim();
  const citationAuthors = Array.from(dom.window.document.querySelectorAll('meta[name="citation_author"]'))
    .map((meta) => meta.getAttribute("content")?.trim())
    .filter((author): author is string => Boolean(author));
  const publisher = dom.window.document.querySelector('meta[name="citation_publisher"], meta[property="og:site_name"]')
    ?.getAttribute("content")?.trim();
  const documentTitle = dom.window.document.title.trim();
  const structuredBody = findStructuredArticleBody(dom.window.document);
  const article = new Readability(dom.window.document, { charThreshold: 120 }).parse();
  if ((!article?.textContent || !article.title) && !citationPdf) {
    throw new Error("Teks utama artikel tidak dapat diekstrak");
  }
  const title = article?.title?.trim() || citationTitle || documentTitle || "Paper tanpa judul";
  const readabilityText = normalizeText(article?.textContent ?? title);
  const contentText = structuredBody && structuredBody.length > readabilityText.length * 1.2
    ? structuredBody
    : readabilityText;
  const contentHtml = structuredBody && structuredBody.length > readabilityText.length * 1.5
    ? structuredArticleHtml(structuredBody, article?.content ?? "")
    : article?.content ?? "";
  return {
    title,
    author: article?.byline?.trim() || citationAuthors.join(", ") || null,
    siteName: article?.siteName?.trim() || publisher || url.hostname.replace(/^www\./, ""),
    contentHtml: sanitizeHtml(contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
      allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "title", "width", "height"] },
      allowedSchemes: ["http", "https"],
      transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noreferrer noopener" }, true) }
    }),
    contentText,
    excerpt: article?.excerpt?.trim() || null,
    citationPdfUrl: citationPdf ? new URL(citationPdf, url).href : null
  };
}

function normalizeArticleAssets(document: Document, baseUrl: URL) {
  for (const image of document.querySelectorAll("img")) {
    const lazySource = ["data-src", "data-lazy-src", "data-original", "data-url"]
      .map((attribute) => image.getAttribute(attribute))
      .find((value) => value && !value.startsWith("data:"));
    const srcset = image.getAttribute("data-srcset") || image.getAttribute("srcset") ||
      image.closest("picture")?.querySelector("source")?.getAttribute("srcset");
    const srcsetSource = srcset ? largestSrcsetSource(srcset) : null;
    const currentSource = image.getAttribute("src");
    const currentIsPlaceholder = !currentSource || currentSource.startsWith("data:") || /(?:spacer|placeholder|blank)(?:[._-]|$)/i.test(currentSource);
    const source = currentIsPlaceholder ? lazySource || srcsetSource : currentSource;
    if (source) {
      try { image.setAttribute("src", new URL(source, baseUrl).href); } catch { /* Keep malformed sources out of the archive. */ }
    }
    image.removeAttribute("srcset");
  }
  for (const anchor of document.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href");
    if (!href) continue;
    try { anchor.setAttribute("href", new URL(href, baseUrl).href); } catch { /* Sanitization removes unsafe links later. */ }
  }
}

function largestSrcsetSource(srcset: string) {
  const candidates = srcset.split(",").map((candidate) => candidate.trim()).filter(Boolean);
  return candidates.at(-1)?.split(/\s+/)[0] ?? null;
}

function findStructuredArticleBody(document: Document) {
  const bodies: string[] = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { collectArticleBodies(JSON.parse(script.textContent || "null"), bodies); } catch { /* Invalid publisher metadata is ignored. */ }
  }
  return bodies.map(normalizeText).sort((a, b) => b.length - a.length)[0] || null;
}

function collectArticleBodies(value: unknown, bodies: string[]) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectArticleBodies(entry, bodies));
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (typeof record.articleBody === "string") bodies.push(record.articleBody);
  Object.values(record).forEach((entry) => collectArticleBodies(entry, bodies));
}

function structuredArticleHtml(body: string, readabilityHtml: string) {
  const paragraphs = body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const textHtml = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const extracted = new JSDOM(`<body>${readabilityHtml}</body>`);
  const figures = Array.from(extracted.window.document.body.querySelectorAll("figure, img"))
    .filter((node) => node.tagName === "FIGURE" || !node.closest("figure"))
    .map((node) => node.outerHTML)
    .join("");
  return `<div>${textHtml}${figures}</div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character] ?? character);
}

export function normalizeText(value: string) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function excerpt(text: string, length = 320) {
  return text.length <= length ? text : `${text.slice(0, length).trimEnd()}…`;
}

export { MAX_IMAGE_BYTES, MAX_PDF_BYTES };
