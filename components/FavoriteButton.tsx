"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "football_favorites";

export function getFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function FavoriteButton({ teamId }: { teamId: number }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(getFavorites().includes(teamId));
  }, [teamId]);

  function toggle() {
    const favs = getFavorites();
    const next = favs.includes(teamId)
      ? favs.filter((id) => id !== teamId)
      : [...favs, teamId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setFav(next.includes(teamId));
  }

  return (
    <button
      onClick={toggle}
      title={fav ? "Remove from favorites" : "Add to favorites"}
      className="text-2xl leading-none transition-transform hover:scale-110"
    >
      {fav ? "★" : "☆"}
    </button>
  );
}
