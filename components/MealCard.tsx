export interface Meal {
  id: number;
  logged_at: string;
  meal_type: string | null;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  confidence: number | null;
  needs_more_info: number;
  clarifying_question: string | null;
  ai_notes: string | null;
}

export default function MealCard({ meal, onDelete }: { meal: Meal; onDelete?: (id: number) => void }) {
  const time = new Date(meal.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {meal.meal_type ?? "Meal"} <span className="text-gray-400 font-normal">· {time}</span>
          </p>
          <p className="text-sm text-gray-600 mt-0.5">{meal.description}</p>
        </div>
        {onDelete && (
          <button onClick={() => onDelete(meal.id)} className="text-xs text-gray-400 hover:text-rose-600">
            Remove
          </button>
        )}
      </div>

      <div className="flex gap-4 mt-3 text-sm">
        <span className="font-semibold text-indigo-700">{meal.calories ?? "?"} kcal</span>
        <span className="text-gray-500">P {meal.protein_g ?? "?"}g</span>
        <span className="text-gray-500">C {meal.carbs_g ?? "?"}g</span>
        <span className="text-gray-500">F {meal.fat_g ?? "?"}g</span>
        {meal.confidence !== null && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${confidenceClass(meal.confidence)}`}>
            {Math.round(meal.confidence * 100)}% confident
          </span>
        )}
      </div>

      {meal.ai_notes && <p className="text-xs text-gray-400 mt-2 italic">{meal.ai_notes}</p>}
    </div>
  );
}

function confidenceClass(confidence: number) {
  if (confidence >= 0.75) return "bg-green-100 text-green-700";
  if (confidence >= 0.5) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}
