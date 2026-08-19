"use client";

import useSWR from "swr";
import type { NewsItem } from "@/lib/rss";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SOURCE_COLORS: Record<string, string> = {
  "BBC Sport": "bg-red-100 text-red-700",
  "The Guardian": "bg-blue-100 text-blue-700",
  ESPN: "bg-orange-100 text-orange-700",
};

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const diff = Date.now() - new Date(pubDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NewsPage() {
  const { data: articles, isLoading } = useSWR<NewsItem[]>(
    "/api/news",
    fetcher,
    { refreshInterval: 900000 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Football News</h1>
        <p className="text-sm text-gray-500 mt-1">
          Latest from BBC Sport, The Guardian &amp; ESPN
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!articles || articles.length === 0) && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📰</p>
          <p className="text-gray-600 font-medium">No news available</p>
          <p className="text-gray-400 text-sm mt-1">
            RSS feeds may be temporarily unavailable
          </p>
        </div>
      )}

      <div className="space-y-3">
        {articles?.map((article) => (
          <a
            key={article.id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors group"
          >
            {article.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={article.image}
                alt=""
                className="w-20 h-16 object-cover rounded flex-shrink-0 bg-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    SOURCE_COLORS[article.source] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {article.source}
                </span>
                {article.pubDate && (
                  <span className="text-xs text-gray-400">
                    {timeAgo(article.pubDate)}
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-green-700 leading-snug text-sm">
                {article.title}
              </h2>
              {article.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {article.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
