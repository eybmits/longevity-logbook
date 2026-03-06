import type { ProgramDefinition, WorkoutDefinition } from '../types.ts';

function workout(id: string, label: string, focus: string, exercises: WorkoutDefinition['exercises']): WorkoutDefinition {
  return { id, label, focus, exercises };
}

export const defaultProgram: ProgramDefinition = {
  zone2Durations: [45, 60, 75],
  zone5Protocols: [
    {
      id: '4x4',
      label: '4x4',
      description: '4 x 4 min hard / 3 min easy',
    },
    {
      id: '6x1',
      label: '6x1',
      description: '6 x 1 min hard / 2 min easy',
    },
    {
      id: '10x30-30',
      label: '10x30/30',
      description: '10 x 30 sec hard / 30 sec easy',
    },
  ],
  repRange: {
    min: 6,
    max: 12,
  },
  weeklyTargets: {
    zone2: 2,
    zone5: 1,
    strength: 4,
  },
  strengthCycle: [
    workout('day-1', 'Day 1', 'Arms and side delts', [
      { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', startingWeight: 17.5, increment: 2.5 },
      { id: 'cable-triceps-pressdown', name: 'Cable Triceps Pressdown', startingWeight: 20, increment: 2.5 },
      { id: 'cable-curl', name: 'Cable Curl', startingWeight: 20, increment: 2.5 },
      { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', startingWeight: 10, increment: 2.5 },
      { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', startingWeight: 25, increment: 2.5 },
      { id: 'lateral-raise', name: 'Lateral Raise', startingWeight: 5, increment: 1 },
    ]),
    workout('day-2', 'Day 2', 'Lats, shoulders, and glutes', [
      { id: 'underhand-close-grip-lat-pulldown', name: 'Underhand Close-Grip Lat Pulldown', startingWeight: 40, increment: 2.5 },
      { id: 'straight-arm-lat-pulldown', name: 'Straight-Arm Lat Pulldown', startingWeight: 25, increment: 2.5 },
      { id: 'joint-friendly-shoulder-press', name: 'Joint-Friendly Shoulder Press', startingWeight: 20, increment: 2.5 },
      { id: 'cable-shoulder-raise', name: 'Cable Shoulder Raise', startingWeight: 5, increment: 1 },
      { id: 'lunges', name: 'Lunges', startingWeight: 20, increment: 2.5 },
      { id: 'glute-machine', name: 'Glute Machine', startingWeight: 40, increment: 5 },
    ]),
    workout('day-3', 'Day 3', 'Chest and posterior chain', [
      { id: 'chest-press', name: 'Chest Press', startingWeight: 35, increment: 2.5 },
      { id: 'deficit-push-up', name: 'Deficit Push-Up', startingWeight: 0, increment: 2.5 },
      { id: 'y-raise', name: 'Y-Raise', startingWeight: 2.5, increment: 1 },
      { id: 'leg-press', name: 'Leg Press', startingWeight: 90, increment: 5 },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', startingWeight: 50, increment: 5 },
    ]),
    workout('day-4', 'Day 4', 'Arms and shoulder isolation', [
      { id: 'overhead-triceps-extension', name: 'Overhead Triceps Extension', startingWeight: 17.5, increment: 2.5 },
      { id: 'cable-triceps-pressdown', name: 'Cable Triceps Pressdown', startingWeight: 20, increment: 2.5 },
      { id: 'single-arm-cable-curl', name: 'Single-Arm Cable Curl', startingWeight: 10, increment: 2.5 },
      { id: 'cable-curl', name: 'Cable Curl', startingWeight: 20, increment: 2.5 },
      { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', startingWeight: 25, increment: 2.5 },
      { id: 'cross-body-cable-y-raise', name: 'Cross-Body Cable Y-Raise', startingWeight: 2.5, increment: 1 },
    ]),
    workout('day-5', 'Day 5', 'Vertical pull, shoulders, and legs', [
      { id: 'weighted-underhand-pull-up', name: 'Weighted Underhand Pull-Up', startingWeight: 0, increment: 2.5 },
      { id: 'overhand-lat-pulldown', name: 'Overhand Lat Pulldown', startingWeight: 40, increment: 2.5 },
      { id: 'joint-friendly-shoulder-press', name: 'Joint-Friendly Shoulder Press', startingWeight: 20, increment: 2.5 },
      { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', startingWeight: 25, increment: 2.5 },
      { id: 'leg-extension', name: 'Leg Extension', startingWeight: 35, increment: 2.5 },
      { id: 'glute-machine', name: 'Glute Machine', startingWeight: 40, increment: 5 },
    ]),
    workout('day-6', 'Day 6', 'Chest, shoulders, and lower body', [
      { id: 'dips', name: 'Dips', startingWeight: 0, increment: 2.5 },
      { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', startingWeight: 20, increment: 2.5 },
      { id: 'cable-shoulder-raise', name: 'Cable Shoulder Raise', startingWeight: 5, increment: 1 },
      { id: 'rear-delt-cable-fly', name: 'Rear Delt Cable Fly', startingWeight: 10, increment: 1 },
      { id: 'squat-machine', name: 'Squat Machine', startingWeight: 70, increment: 5 },
      { id: 'glute-machine', name: 'Glute Machine', startingWeight: 40, increment: 5 },
    ]),
  ],
};

let activeProgram: ProgramDefinition = cloneProgram(defaultProgram);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneProgram(program: ProgramDefinition): ProgramDefinition {
  return deepClone(program);
}

export function createDefaultProgram(): ProgramDefinition {
  return cloneProgram(defaultProgram);
}

export function getProgram(): ProgramDefinition {
  return activeProgram;
}

export function setProgram(program: ProgramDefinition): void {
  activeProgram = cloneProgram(program);
}

export function getDefaultWorkoutDefinition(workoutId: string): WorkoutDefinition {
  return deepClone(
    defaultProgram.strengthCycle.find((workout) => workout.id === workoutId) ?? defaultProgram.strengthCycle[0],
  );
}
