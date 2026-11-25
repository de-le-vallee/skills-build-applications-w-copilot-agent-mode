import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type InputRecord = Record<string, unknown>;

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function asRecord(input: unknown): InputRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'Request body must be an object');
  }
  return input as InputRecord;
}

function requireText(input: InputRecord, field: string) {
  const value = input[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw httpError(400, `${field} is required`);
  }
  return value;
}

function requireObjectId(input: InputRecord, field: string) {
  const value = input[field];
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw httpError(400, `${field} must be a valid id`);
  }
  return value;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = requireObjectId(body, 'userId');
  const teamId = requireObjectId(body, 'teamId');
  const type = requireText(body, 'type');
  const minutes = body.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists) throw httpError(404, 'User not found');
  if (!teamExists) throw httpError(404, 'Team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requireText(body, 'name');
  const mascot = requireText(body, 'mascot');
  const members = body.members ?? [];
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw httpError(400, 'members must contain valid user ids');
  }
  if (members.length > 0) {
    const memberIds = [...new Set(members)];
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) {
      throw httpError(404, 'One or more team members were not found');
    }
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(20)
    .lean();
  const activityFocuses = recentActivities.map(({ type }) => {
    if (type === 'strength') return 'strength';
    if (type === 'run' || type === 'cycle' || type === 'walk') return 'endurance';
    return type;
  });
  const preferredFocus = activityFocuses[0] ?? user.fitnessGoal;
  const focuses = new Set([preferredFocus, user.fitnessGoal, ...activityFocuses]);
  const workouts = await Workout.find().lean();
  const focusOrder = new Map([...focuses].map((focus, index) => [focus, index]));

  return workouts
    .sort((first, second) => (focusOrder.get(first.focus) ?? focusOrder.size) - (focusOrder.get(second.focus) ?? focusOrder.size))
    .map((workout) => ({
      ...workout,
      reason: workout.focus === preferredFocus
        ? `Matches your recent activity and ${user.fitnessGoal} fitness goal`
        : workout.focus === user.fitnessGoal
          ? `Supports your ${user.fitnessGoal} fitness goal`
          : 'Provides variety for your training plan',
    }));
}

export { User };
