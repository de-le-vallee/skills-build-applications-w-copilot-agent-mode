import { CapabilityCard } from './CapabilityCard.js';
import { useApi } from '../api/useApi.js';

type LeaderboardResponse = {
  leaderboard: Array<{ teamName: string; totalPoints: number; rank: number }>;
};

export default function Leaderboard() {
  const { data, error, loading } = useApi<LeaderboardResponse>('/api/leaderboard');

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error}>
      {data?.leaderboard.length === 0 ? (
        <p>No leaderboard rankings yet.</p>
      ) : (
        <ol className="list-group list-group-numbered">
          {data?.leaderboard.map((entry) => (
            <li className="list-group-item d-flex justify-content-between" key={entry.teamName}>
              <span>{entry.rank}. {entry.teamName}</span>
              <strong>{entry.totalPoints} points</strong>
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
