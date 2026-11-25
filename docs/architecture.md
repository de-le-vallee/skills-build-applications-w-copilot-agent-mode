# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route components responsible for accessible presentation while sharing API URL construction and fetch behavior through `src/api/client.ts`; expose loading, success, empty, and error states for every capability.
- Logic tier decision: Keep Express routes under `/api/`, move business behavior into explicit service functions, and return deliberate 4xx responses for invalid or missing resources instead of leaking Mongoose cast errors as 500 responses.
- Data tier decision: Define required fields and relationships in Mongoose schemas and seed stable demo fixtures with upserts. Preserve unrelated records and remove a moved seeded user's membership from the previous demo team.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes`; require valid existing user and team records; then create an activity with computed points and `occurredAt`, and list stored activities.
- Team management approach: Require a team name, preserve submitted names and mascots, default members to an empty array, and create/list teams with their member references.
- Leaderboard approach: Aggregate stored activity points by team in the API/service layer, sort totals highest first, include each team name, and assign 1-based ranks after sorting.
- Workout suggestions approach: Resolve the user by email, inspect recent activity and the user's fitness goal, prioritize matching workout focuses, include a specific reason, and return a deliberate 4xx for an unknown email.

## Test plan

Run the focused suites in tier order so a lower-tier failure is resolved before its dependent API or UI behavior is changed.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Run first to verify Mongoose validation, relationships, and seed behavior.
  - Current result: 4 of 5 tests fail because user, team, activity, and workout schemas do not enforce required fields; the idempotent seed test passes.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Run after data contracts pass to verify validation, persistence, aggregation, and recommendations.
  - Current result: 4 of 4 tests fail because activity/team POST routes still return 501, leaderboard is empty, and workout results lack a reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Run after API behavior is implemented to verify route rendering and accessible request states.
  - Current result: 15 of 15 tests fail because capability pages remain at `Implementation pending` and do not fetch or render loading, data, empty, or error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Run after backend tests pass to verify TypeScript correctness across the backend.
  - Current result: not yet run.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Run after frontend tests pass to verify TypeScript correctness and the Vite production bundle.
  - Current result: not yet run.
