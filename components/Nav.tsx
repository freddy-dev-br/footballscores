"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/workouts", label: "Workouts" },
  { href: "/activity", label: "Activity" },
  { href: "/goals", label: "Goals" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-indigo-700 text-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-1 overflow-x-auto">
        <Link href="/" className="font-bold text-lg tracking-tight whitespace-nowrap mr-4">
          🏋️ FitTrack
        </Link>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm px-3 py-1.5 rounded whitespace-nowrap font-medium transition-colors ${
              pathname === link.href ? "bg-white text-indigo-800" : "text-indigo-100 hover:bg-indigo-600"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
