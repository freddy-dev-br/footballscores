export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
  source: string;
}

const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" },
  { url: "https://www.theguardian.com/football/rss", source: "The Guardian" },
  { url: "https://www.espn.com/espn/rss/soccer/news", source: "ESPN" },
];

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function extractMediaUrl(item: string): string {
  const media = item.match(/<media:(?:thumbnail|content)[^>]*url="([^"]+)"/i);
  if (media) return media[1];
  const enc = item.match(/<enclosure[^>]*url="([^"]+)"/i);
  if (enc) return enc[1];
  // Guardian uses og:image style inside content
  const img = item.match(/<img[^>]*src="([^"]+)"/i);
  return img ? img[1] : "";
}

function parseItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(xml)) !== null) {
    const raw = m[1];
    const title = extractTag(raw, "title").replace(/<[^>]*>/g, "");
    const link =
      extractTag(raw, "link") ||
      extractTag(raw, "guid").replace(/^<!.*>$/, "");
    const description = extractTag(raw, "description")
      .replace(/<[^>]*>/g, "")
      .slice(0, 200)
      .trim();
    const pubDate = extractTag(raw, "pubDate");
    const image = extractMediaUrl(raw);

    if (title && link && link.startsWith("http")) {
      items.push({ id: `${source}::${link}`, title, link, description, pubDate, image, source });
    }
  }

  return items;
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "FootballScores/1.0 (rss reader)" },
          next: { revalidate: 900 },
        });
        if (!res.ok) return [] as NewsItem[];
        const xml = await res.text();
        return parseItems(xml, source).slice(0, 12);
      } catch {
        return [] as NewsItem[];
      }
    })
  );

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  return all.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });
}
