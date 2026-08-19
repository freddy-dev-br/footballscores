export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  video_search_query: string;
}

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.video_search_query)}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
          <p className="text-xs text-gray-500 capitalize">
            {exercise.muscle_group} · {exercise.equipment} · {exercise.difficulty}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap capitalize">
          {exercise.category}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{exercise.instructions}</p>
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mt-2"
      >
        ▶ Watch proper form
      </a>
    </div>
  );
}
