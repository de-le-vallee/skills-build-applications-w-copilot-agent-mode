import { CapabilityCard } from './CapabilityCard.js';
import { useApi } from '../api/useApi.js';

type WorkoutResponse = {
  suggestions: Array<{ title: string; focus?: string; minutes?: number; difficulty?: string; reason: string }>;
};

export default function Workouts() {
  const email = encodeURIComponent('mona@example.com');
  const { data, error, loading } = useApi<WorkoutResponse>(`/api/workouts/suggestions/${email}`);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
    >
      {data?.suggestions.length === 0 ? (
        <p>No workout suggestions yet.</p>
      ) : (
        <ul className="list-group">
          {data?.suggestions.map((workout) => (
            <li className="list-group-item" key={workout.title}>
              <strong>{workout.title}</strong>
              <span className="d-block">{workout.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
