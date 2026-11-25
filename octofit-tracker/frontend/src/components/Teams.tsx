import { CapabilityCard } from './CapabilityCard.js';
import { useApi } from '../api/useApi.js';

type TeamResponse = {
  teams: Array<{ name: string; mascot?: string; members: string[] }>;
};

export default function Teams() {
  const { data, error, loading } = useApi<TeamResponse>('/api/teams');

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error}>
      {data?.teams.length === 0 ? (
        <p>No teams yet.</p>
      ) : (
        <ul className="list-group">
          {data?.teams.map((team) => (
            <li className="list-group-item" key={team.name}>
              <strong>{team.name}</strong>
              {team.mascot ? ` — ${team.mascot}` : ''}
              <span className="d-block">{team.members.length} members</span>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
