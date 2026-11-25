import { CapabilityCard } from './CapabilityCard.js';
import { useApi } from '../api/useApi.js';

type ActivityResponse = {
  activities: Array<{ type: string; minutes: number; points: number }>;
};

export default function Activities() {
  const { data, error, loading } = useApi<ActivityResponse>('/api/activities');

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
    >
      {data?.activities.length === 0 ? (
        <p>No activities yet.</p>
      ) : (
        <ul className="list-group">
          {data?.activities.map((activity, index) => (
            <li className="list-group-item" key={`${activity.type}-${index}`}>
              <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
