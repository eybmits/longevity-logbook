import { getProgram } from '../data/program.ts';
import type {
  ArchiveEntry,
  BodyweightSummary,
  DayWindow,
  ExerciseDefinition,
  SessionRecord,
  SessionType,
  StrengthExerciseDraft,
  StrengthSessionRecord,
  WeightSessionRecord,
  WindowSummary,
  WorkoutDefinition,
} from '../types.ts';
import { createPreviousWindow, getDayKeyFromCompletedAt, isDayInWindow } from './dates.ts';

function byCompletedAtAscending(left: SessionRecord, right: SessionRecord): number {
  const leftTime = new Date(left.completedAt).getTime();
  const rightTime = new Date(right.completedAt).getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.id.localeCompare(right.id);
}

export function sortByCompletedAtDescending<T extends SessionRecord>(sessions: T[]): T[] {
  return [...sessions].sort((left, right) => byCompletedAtAscending(right, left));
}

export function getSessionsInWindow<T extends SessionRecord>(sessions: T[], window: DayWindow): T[] {
  return sessions.filter((session) => isDayInWindow(getDayKeyFromCompletedAt(session.completedAt), window));
}

export function summarizeWindow(sessions: SessionRecord[]): WindowSummary {
  const program = getProgram();
  const zone2Count = sessions.filter((session) => session.type === 'zone2').length;
  const zone5Count = sessions.filter((session) => session.type === 'zone5').length;
  const strengthCount = sessions.filter((session) => session.type === 'strength').length;
  const completedGoals = Number(zone2Count >= program.weeklyTargets.zone2)
    + Number(zone5Count >= program.weeklyTargets.zone5)
    + Number(strengthCount >= program.weeklyTargets.strength);

  return {
    zone2Count,
    zone5Count,
    strengthCount,
    completedGoals,
    completed: completedGoals === 3,
  };
}

export function buildArchive(sessions: SessionRecord[], currentWindow: DayWindow): ArchiveEntry[] {
  const pastDayKeys = sessions
    .map((session) => getDayKeyFromCompletedAt(session.completedAt))
    .filter((dayKey) => dayKey < currentWindow.startDay)
    .sort();

  if (pastDayKeys.length === 0) {
    return [];
  }

  const earliestPastDay = pastDayKeys[0];
  const archive: ArchiveEntry[] = [];
  let index = 1;

  while (true) {
    const window = createPreviousWindow(currentWindow, index);
    const blockSessions = getSessionsInWindow(sessions, window);

    if (blockSessions.length > 0) {
      archive.push({
        window,
        sessions: sortByCompletedAtDescending(blockSessions),
        summary: summarizeWindow(blockSessions),
      });
    }

    if (window.startDay <= earliestPastDay) {
      break;
    }

    index += 1;
  }

  return archive;
}

export function getStrengthSessions(sessions: SessionRecord[]): StrengthSessionRecord[] {
  return sessions
    .filter((session): session is StrengthSessionRecord => session.type === 'strength')
    .sort(byCompletedAtAscending);
}

export function getWeightSessions(sessions: SessionRecord[]): WeightSessionRecord[] {
  return sessions
    .filter((session): session is WeightSessionRecord => session.type === 'weight')
    .sort(byCompletedAtAscending);
}

export function summarizeBodyweight(sessions: SessionRecord[], currentWindow: DayWindow): BodyweightSummary {
  const weightSessions = getWeightSessions(sessions);

  return {
    latestEntry: weightSessions.at(-1) ?? null,
    previousEntry: weightSessions.at(-2) ?? null,
    currentWindowCount: getSessionsInWindow(weightSessions, currentWindow).length,
  };
}

export function formatBodyweight(bodyweightKg: number): string {
  return `${bodyweightKg.toFixed(1)} kg`;
}

export function getWorkoutDefinition(workoutId: string): WorkoutDefinition {
  const program = getProgram();
  return program.strengthCycle.find((workout) => workout.id === workoutId) ?? program.strengthCycle[0];
}

function roundWeight(weight: number): number {
  return Math.round(weight * 10) / 10;
}

function findExerciseDefinition(exerciseId: string): ExerciseDefinition | null {
  const program = getProgram();
  for (const workout of program.strengthCycle) {
    const match = workout.exercises.find((exercise) => exercise.id === exerciseId);
    if (match) {
      return match;
    }
  }

  return null;
}

export function getNextWorkoutDefinition(sessions: SessionRecord[]): WorkoutDefinition {
  const program = getProgram();
  const strengthSessions = getStrengthSessions(sessions);
  if (strengthSessions.length === 0) {
    return program.strengthCycle[0];
  }

  const lastWorkoutId = strengthSessions[strengthSessions.length - 1].payload.workoutId;
  const currentIndex = program.strengthCycle.findIndex((workout) => workout.id === lastWorkoutId);

  if (currentIndex === -1) {
    return program.strengthCycle[0];
  }

  const nextIndex = (currentIndex + 1) % program.strengthCycle.length;
  return program.strengthCycle[nextIndex];
}

export function createStrengthDraft(workout: WorkoutDefinition, sessions: SessionRecord[]): StrengthExerciseDraft[] {
  const program = getProgram();
  const strengthSessions = getStrengthSessions(sessions);

  return workout.exercises.map((exercise) => {
    const state = strengthSessions.reduce(
      (current, session) => {
        const result = session.payload.exercises.find((entry) => entry.exerciseId === exercise.id);

        if (!result) {
          return current;
        }

        if (!result.completed) {
          return {
            targetReps: result.targetReps,
            actualWeight: result.actualWeight,
          };
        }

        if (result.targetReps >= program.repRange.max) {
          return {
            targetReps: program.repRange.min,
            actualWeight: roundWeight(result.actualWeight + exercise.increment),
          };
        }

        return {
          targetReps: result.targetReps + 1,
          actualWeight: result.actualWeight,
        };
      },
      {
        targetReps: program.repRange.min,
        actualWeight: exercise.startingWeight,
      },
    );

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetReps: state.targetReps,
      actualWeight: state.actualWeight,
      completed: false,
      increment: exercise.increment,
    };
  });
}

export function createStrengthEditDraft(session: StrengthSessionRecord): StrengthExerciseDraft[] {
  return session.payload.exercises.map((exercise) => {
    const definition = findExerciseDefinition(exercise.exerciseId);

    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      targetReps: exercise.targetReps,
      actualWeight: exercise.actualWeight,
      completed: exercise.completed,
      increment: definition?.increment ?? exercise.increment,
    };
  });
}

export function formatSessionDetails(session: SessionRecord): string {
  if (session.type === 'zone2') {
    return `${session.payload.durationMinutes} min steady`;
  }

  if (session.type === 'zone5') {
    return session.payload.protocolLabel;
  }

  if (session.type === 'weight') {
    return formatBodyweight(session.payload.bodyweightKg);
  }

  const completedExercises = session.payload.exercises.filter((exercise) => exercise.completed).length;
  return `${session.payload.workoutLabel} | ${completedExercises}/${session.payload.exercises.length} done`;
}

export function formatStrengthExerciseLine(exercise: StrengthSessionRecord['payload']['exercises'][number]): string {
  const status = exercise.completed ? 'done' : 'open';
  return `${exercise.exerciseName} | ${exercise.actualWeight} kg x ${exercise.targetReps} | ${status}`;
}

export function formatSessionType(type: SessionType): string {
  if (type === 'zone2') {
    return 'Zone 2';
  }

  if (type === 'zone5') {
    return 'Zone 5';
  }

  if (type === 'weight') {
    return 'Weight';
  }

  return 'Strength';
}
