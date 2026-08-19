export default function StatCard({
  label,
  value,
  unit,
  sublabel,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  accent?: "indigo" | "green" | "amber" | "rose";
}) {
  const accentClass = {
    indigo: "text-indigo-700",
    green: "text-green-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  }[accent];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentClass}`}>
        {value}
        {unit && <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>}
      </p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}
