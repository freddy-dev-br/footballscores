interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  color: "cyan" | "green" | "purple" | "orange" | "red" | "blue";
  progress?: number;
}

const colorMap = {
  cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
  green: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400",
  purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
  orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400",
  red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
};

const progressColorMap = {
  cyan: "bg-cyan-400",
  green: "bg-green-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
  red: "bg-red-400",
  blue: "bg-blue-400",
};

export default function MetricCard({ label, value, unit, subtitle, color, progress }: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColorMap[color]} rounded-full transition-all`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
