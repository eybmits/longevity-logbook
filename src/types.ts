export type SessionType = 'zone2' | 'zone5' | 'strength' | 'weight';

export interface ExerciseDefinition {
  id: string;
  name: string;
  startingWeight: number;
  increment: number;
}

export interface WorkoutDefinition {
  id: string;
  label: string;
  focus: string;
  exercises: ExerciseDefinition[];
}

export interface Zone5ProtocolDefinition {
  id: string;
  label: string;
  description: string;
}

export interface ProgramDefinition {
  zone2Durations: number[];
  zone5Protocols: Zone5ProtocolDefinition[];
  repRange: {
    min: number;
    max: number;
  };
  weeklyTargets: {
    zone2: number;
    zone5: number;
    strength: number;
  };
  strengthCycle: WorkoutDefinition[];
}

export interface StrengthExerciseResult {
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  actualWeight: number;
  completed: boolean;
  increment: number;
}

export interface Zone2SessionRecord {
  id: string;
  type: 'zone2';
  completedAt: string;
  payload: {
    durationMinutes: number;
  };
}

export interface Zone5SessionRecord {
  id: string;
  type: 'zone5';
  completedAt: string;
  payload: {
    protocolId: string;
    protocolLabel: string;
  };
}

export interface StrengthSessionRecord {
  id: string;
  type: 'strength';
  completedAt: string;
  payload: {
    workoutId: string;
    workoutLabel: string;
    exercises: StrengthExerciseResult[];
  };
}

export interface WeightSessionRecord {
  id: string;
  type: 'weight';
  completedAt: string;
  payload: {
    bodyweightKg: number;
  };
}

export type SessionRecord = Zone2SessionRecord | Zone5SessionRecord | StrengthSessionRecord | WeightSessionRecord;

export interface DayWindow {
  startDay: string;
  endDay: string;
}

export interface WindowSummary {
  zone2Count: number;
  zone5Count: number;
  strengthCount: number;
  completedGoals: number;
  completed: boolean;
}

export interface BodyweightSummary {
  latestEntry: WeightSessionRecord | null;
  previousEntry: WeightSessionRecord | null;
  currentWindowCount: number;
}

export interface StrengthExerciseDraft {
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  actualWeight: number;
  completed: boolean;
  increment: number;
}

export interface ArchiveEntry {
  window: DayWindow;
  sessions: SessionRecord[];
  summary: WindowSummary;
}

export interface LogbookFile {
  version: 2;
  sessions: SessionRecord[];
  program: ProgramDefinition;
}

export interface LegacyLogbookFile {
  version: 1;
  sessions: SessionRecord[];
}
