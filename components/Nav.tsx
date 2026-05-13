"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <nav className="bg-green-700 text-white px-4 py-3 flex items-center gap-4">
      <Link href="/" className="font-bold text-lg tracking-tight whitespace-nowrap">
        ⚽ FootballScores
      </Link>
      <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-md">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search team…"
          className="flex-1 rounded px-3 py-1.5 text-sm text-gray-900 outline-none"
        />
        <button
          type="submit"
          className="bg-white text-green-800 font-semibold px-3 py-1.5 rounded text-sm hover:bg-green-50"
        >
          Search
        </button>
      </form>
      <Link href="/favorites" className="text-sm hover:underline whitespace-nowrap">
        My Teams
      </Link>
    </nav>
  );
}
