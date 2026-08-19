"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/fitness", label: "Today", icon: "◉" },
  { href: "/fitness/workouts", label: "Fitness", icon: "⚡" },
  { href: "/fitness/diet", label: "Diet", icon: "🥗" },
  { href: "/fitness/sleep", label: "Sleep", icon: "🌙" },
  { href: "/fitness/health", label: "Health", icon: "❤" },
];

export default function FitnessNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="max-w-lg mx-auto flex justify-around">
        {tabs.map((tab) => {
          const active = tab.href === "/fitness" ? pathname === "/fitness" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                active ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
