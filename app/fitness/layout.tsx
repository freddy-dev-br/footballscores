import type { Metadata } from "next";
import FitnessNav from "@/components/fitness/FitnessNav";

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "Track your workouts, diet, sleep and steps",
};

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 pb-20 max-w-lg mx-auto w-full px-4">
        {children}
      </div>
      <FitnessNav />
    </div>
  );
}
