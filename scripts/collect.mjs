import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import Parser from "rss-parser";
import { FEEDS } from "./feeds.mjs";

const DATA_DIR = path.join(process.cwd(), "docs", "data");
const ARCHIVE_DIR = path.join(DATA_DIR, "archive");
const LATEST_PATH = path.join(DATA_DIR, "latest.json");
const META_PATH = path.join(DATA_DIR, "meta.json");
const ARCHIVE_INDEX_PATH = path.join(ARCHIVE_DIR, "index.json");

const LATEST_MAX_ITEMS = 500;
const LATEST_MAX_AGE_DAYS = 3;

const parser = new Parser({ timeout: 20000 });

// rss-parser's built-in HTTP client doesn't decompress gzip responses (some
// feeds, e.g. Tubefilter, always gzip regardless of Accept-Encoding). Fetch
// manually — the platform fetch() decompresses transparently — and hand the
// decoded text to parser.parseString() instead of parser.parseURL().
async function fetchFeedText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; mynews-2609/1.0)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function linkId(link) {
  return createHash("sha1").update(link).digest("hex").slice(0, 16);
}

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function fetchFeed(feed) {
  const text = await fetchFeedText(feed.url);
  const parsed = await parser.parseString(text);
  const items = (parsed.items ?? [])
    .map((item) => {
      const link = item.link?.trim();
      if (!link) return null;
      const publishedAt =
        item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null);
      return {
        id: linkId(link),
        title: (item.title ?? "").trim(),
        link,
        source: feed.name,
        sourceId: feed.id,
        category: feed.category,
        publishedAt: publishedAt ?? new Date().toISOString(),
        snippet: (item.contentSnippet ?? "").replace(/\s+/g, " ").trim().slice(0, 240),
      };
    })
    .filter(Boolean);
  return items;
}

function dedupeByLink(items) {
  const map = new Map();
  for (const item of items) {
    const existing = map.get(item.id);
    if (!existing || new Date(item.publishedAt) > new Date(existing.publishedAt)) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function monthKey(dateIso) {
  return dateIso.slice(0, 7); // YYYY-MM
}

async function main() {
  await mkdir(ARCHIVE_DIR, { recursive: true });

  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)));

  const newItems = [];
  const feedStatus = [];
  results.forEach((result, i) => {
    const feed = FEEDS[i];
    if (result.status === "fulfilled") {
      newItems.push(...result.value);
      feedStatus.push({ id: feed.id, name: feed.name, ok: true, count: result.value.length });
    } else {
      feedStatus.push({
        id: feed.id,
        name: feed.name,
        ok: false,
        error: String(result.reason?.message ?? result.reason),
      });
    }
  });

  // --- latest.json: recent window across all feeds, for the live dashboard ---
  const previousLatest = await readJson(LATEST_PATH, []);
  const mergedLatest = dedupeByLink([...previousLatest, ...newItems]).sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );
  const cutoff = Date.now() - LATEST_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const latest = mergedLatest
    .filter((item) => new Date(item.publishedAt).getTime() >= cutoff)
    .slice(0, LATEST_MAX_ITEMS);
  await writeFile(LATEST_PATH, JSON.stringify(latest, null, 2));

  // --- monthly archive: full history, for search ---
  const itemsByMonth = new Map();
  for (const item of newItems) {
    const key = monthKey(item.publishedAt);
    if (!itemsByMonth.has(key)) itemsByMonth.set(key, []);
    itemsByMonth.get(key).push(item);
  }

  const archiveIndex = new Set(await readJson(ARCHIVE_INDEX_PATH, []));
  for (const [key, items] of itemsByMonth) {
    const archivePath = path.join(ARCHIVE_DIR, `${key}.json`);
    const existing = await readJson(archivePath, []);
    const merged = dedupeByLink([...existing, ...items]).sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    await writeFile(archivePath, JSON.stringify(merged, null, 2));
    archiveIndex.add(key);
  }
  await writeFile(
    ARCHIVE_INDEX_PATH,
    JSON.stringify([...archiveIndex].sort().reverse(), null, 2)
  );

  await writeFile(
    META_PATH,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString(),
        feeds: feedStatus,
        latestCount: latest.length,
      },
      null,
      2
    )
  );

  const failed = feedStatus.filter((f) => !f.ok);
  console.log(`Collected ${newItems.length} items (${latest.length} in latest window).`);
  if (failed.length) {
    console.warn("Feeds that failed:", failed.map((f) => `${f.name}: ${f.error}`).join(" | "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
