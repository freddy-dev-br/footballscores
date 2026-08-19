"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Live" },
  { href: "/calendar", label: "Calendar" },
  { href: "/news", label: "News" },
  { href: "/search", label: "Teams" },
  { href: "/favorites", label: "My Teams" },
];

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  }

  return (
    <nav className="bg-green-700 text-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 py-3">
          <Link href="/" className="font-bold text-lg tracking-tight whitespace-nowrap mr-1">
            ⚽ FootballScores
          </Link>

          <div className="hidden sm:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${pathname === href
                    ? "bg-green-900 text-white"
                    : "hover:bg-green-600 text-green-100"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSearch} className="hidden sm:flex gap-2 ml-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search team…"
              className="rounded px-3 py-1.5 text-sm text-gray-900 outline-none w-36 focus:w-48 transition-all"
            />
            <button
              type="submit"
              className="bg-white text-green-800 font-semibold px-3 py-1.5 rounded text-sm hover:bg-green-50"
            >
              Go
            </button>
          </form>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden ml-auto p-1.5 rounded hover:bg-green-600"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <span className="block w-5 h-0.5 bg-white mb-1" />
            <span className="block w-5 h-0.5 bg-white mb-1" />
            <span className="block w-5 h-0.5 bg-white" />
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="sm:hidden pb-3 space-y-1 border-t border-green-600 pt-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded text-sm font-medium
                  ${pathname === href ? "bg-green-900" : "hover:bg-green-600"}`}
              >
                {label}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="flex gap-2 px-1 pt-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search team…"
                className="flex-1 rounded px-3 py-1.5 text-sm text-gray-900 outline-none"
              />
              <button
                type="submit"
                className="bg-white text-green-800 font-semibold px-3 py-1.5 rounded text-sm"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
