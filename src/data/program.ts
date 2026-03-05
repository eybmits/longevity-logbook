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
    workout('push-a', 'Push A', 'Chest, shoulders, triceps', [
      { id: 'incline-db-press', name: 'Incline DB Press', startingWeight: 20, increment: 2.5 },
      { id: 'machine-chest-press', name: 'Machine Chest Press', startingWeight: 35, increment: 2.5 },
      { id: 'seated-shoulder-press', name: 'Seated Shoulder Press', startingWeight: 22.5, increment: 2.5 },
      { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', startingWeight: 5, increment: 2.5 },
      { id: 'rope-pressdown', name: 'Rope Pressdown', startingWeight: 20, increment: 2.5 },
    ]),
    workout('pull-a', 'Pull A', 'Lats, back, biceps', [
      { id: 'lat-pulldown', name: 'Lat Pulldown', startingWeight: 40, increment: 2.5 },
      { id: 'chest-supported-row', name: 'Chest-Supported Row', startingWeight: 35, increment: 2.5 },
      { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', startingWeight: 25, increment: 2.5 },
      { id: 'cable-curl', name: 'Cable Curl', startingWeight: 20, increment: 2.5 },
      { id: 'hammer-curl', name: 'Hammer Curl', startingWeight: 12.5, increment: 2.5 },
    ]),
    workout('legs-a', 'Legs A', 'Quads, hamstrings, glutes', [
      { id: 'leg-press', name: 'Leg Press', startingWeight: 90, increment: 5 },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', startingWeight: 50, increment: 5 },
      { id: 'lying-leg-curl', name: 'Leg Curl', startingWeight: 30, increment: 2.5 },
      { id: 'leg-extension', name: 'Leg Extension', startingWeight: 35, increment: 2.5 },
      { id: 'standing-calf-raise', name: 'Standing Calf Raise', startingWeight: 45, increment: 2.5 },
    ]),
    workout('push-b', 'Push B', 'Chest, shoulders, triceps', [
      { id: 'flat-db-press', name: 'Flat DB Press', startingWeight: 22.5, increment: 2.5 },
      { id: 'smith-incline-press', name: 'Smith Incline Press', startingWeight: 35, increment: 2.5 },
      { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', startingWeight: 25, increment: 2.5 },
      { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', startingWeight: 5, increment: 2.5 },
      { id: 'overhead-cable-extension', name: 'Overhead Cable Extension', startingWeight: 17.5, increment: 2.5 },
    ]),
    workout('pull-b', 'Pull B', 'Lats, back, biceps', [
      { id: 'machine-pull-up', name: 'Machine Pull-Up', startingWeight: 35, increment: 2.5 },
      { id: 'seated-row', name: 'Seated Row', startingWeight: 37.5, increment: 2.5 },
      { id: 'one-arm-cable-row', name: 'One-Arm Cable Row', startingWeight: 22.5, increment: 2.5 },
      { id: 'rear-delt-fly', name: 'Rear Delt Fly', startingWeight: 20, increment: 2.5 },
      { id: 'ez-curl', name: 'EZ Curl', startingWeight: 20, increment: 2.5 },
    ]),
    workout('legs-b', 'Legs B', 'Quads, hamstrings, glutes', [
      { id: 'hack-squat', name: 'Hack Squat', startingWeight: 70, increment: 5 },
      { id: 'back-extension', name: 'Back Extension', startingWeight: 20, increment: 2.5 },
      { id: 'seated-leg-curl', name: 'Seated Leg Curl', startingWeight: 32.5, increment: 2.5 },
      { id: 'leg-extension', name: 'Leg Extension', startingWeight: 35, increment: 2.5 },
      { id: 'seated-calf-raise', name: 'Seated Calf Raise', startingWeight: 35, increment: 2.5 },
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
