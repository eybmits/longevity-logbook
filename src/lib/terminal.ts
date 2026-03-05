import pc from 'picocolors';
import { getProgram } from '../data/program.ts';
import { formatSessionDate, formatWindow } from './dates.ts';
import { formatSessionDetails, formatSessionType, formatStrengthExerciseLine } from './training.ts';
import type {
  ArchiveEntry,
  DayWindow,
  SessionRecord,
  StrengthSessionRecord,
  WindowSummary,
  WorkoutDefinition,
} from '../types.ts';

function divider(): string {
  return pc.dim('-'.repeat(72));
}

function progressBar(current: number, target: number, width = 12): string {
  const ratio = target === 0 ? 1 : Math.min(current / target, 1);
  const filled = Math.round(ratio * width);
  const bar = `${'='.repeat(filled)}${'.'.repeat(width - filled)}`;
  return pc.red(`[${bar}]`);
}

function sectionTitle(title: string): string {
  return pc.bold(pc.white(title.toUpperCase()));
}

function metricLine(label: string, current: number, target: number): string {
  const count = pc.bold(`${current}/${target}`);
  return `${label.padEnd(16)} ${count.padEnd(8)} ${progressBar(current, target)}`;
}

function previewRows(sessions: SessionRecord[]): string[] {
  if (sessions.length === 0) {
    return [pc.dim('No sessions logged in the current window.')];
  }

  return sessions.slice(0, 6).map((session) => {
    const left = `${formatSessionDate(session.completedAt).padEnd(12)} ${formatSessionType(session.type).padEnd(10)}`;
    return `${left} ${formatSessionDetails(session)}`;
  });
}

export function renderDashboard(args: {
  currentWindow: DayWindow;
  summary: WindowSummary;
  currentSessions: SessionRecord[];
  nextWorkout: WorkoutDefinition;
  storagePath: string;
  flashMessage?: string | null;
}): string {
  const { currentWindow, summary, currentSessions, nextWorkout, storagePath, flashMessage } = args;
  const program = getProgram();
  const lines: string[] = [];

  lines.push(pc.bold(pc.red('LONGEVITY LOG')));
  lines.push(pc.dim(`Rolling 7-day block  ${formatWindow(currentWindow)}`));
  lines.push(pc.dim(`Data file            ${storagePath}`));

  if (flashMessage) {
    lines.push(pc.green(flashMessage));
  }

  lines.push('');
  lines.push(sectionTitle('Weekly status'));
  lines.push(divider());
  lines.push(`Goals completed   ${pc.bold(`${summary.completedGoals}/3`)}`);
  lines.push(metricLine('Zone 2', summary.zone2Count, program.weeklyTargets.zone2));
  lines.push(metricLine('Zone 5 / HIIT', summary.zone5Count, program.weeklyTargets.zone5));
  lines.push(metricLine('Strength', summary.strengthCount, program.weeklyTargets.strength));
  lines.push('');
  lines.push(sectionTitle('Next strength session'));
  lines.push(divider());
  lines.push(`${pc.bold(nextWorkout.label)}  ${pc.dim(nextWorkout.focus)}`);
  lines.push('');
  lines.push(sectionTitle('This week'));
  lines.push(divider());
  lines.push(...previewRows(currentSessions));

  return lines.join('\n');
}

export function renderSessionList(title: string, windowLabel: string, sessions: SessionRecord[], summary?: WindowSummary): string {
  const program = getProgram();
  const lines: string[] = [];

  lines.push(sectionTitle(title));
  lines.push(pc.dim(windowLabel));
  lines.push(divider());

  if (summary) {
    lines.push(metricLine('Zone 2', summary.zone2Count, program.weeklyTargets.zone2));
    lines.push(metricLine('Zone 5 / HIIT', summary.zone5Count, program.weeklyTargets.zone5));
    lines.push(metricLine('Strength', summary.strengthCount, program.weeklyTargets.strength));
    lines.push('');
  }

  if (sessions.length === 0) {
    lines.push(pc.dim('No sessions here yet.'));
    return lines.join('\n');
  }

  for (const session of sessions) {
    const header = `${formatSessionDate(session.completedAt).padEnd(12)} ${formatSessionType(session.type).padEnd(10)} ${formatSessionDetails(session)}`;
    lines.push(header);
  }

  return lines.join('\n');
}

export function renderStrengthSession(session: StrengthSessionRecord): string {
  const lines: string[] = [];

  lines.push(sectionTitle(`${session.payload.workoutLabel} details`));
  lines.push(pc.dim(formatSessionDate(session.completedAt)));
  lines.push(divider());

  for (const exercise of session.payload.exercises) {
    lines.push(formatStrengthExerciseLine(exercise));
  }

  return lines.join('\n');
}

export function renderArchiveList(entries: ArchiveEntry[]): string {
  const lines: string[] = [];

  lines.push(sectionTitle('History'));
  lines.push(divider());

  if (entries.length === 0) {
    lines.push(pc.dim('No archived weeks yet.'));
    return lines.join('\n');
  }

  for (const entry of entries) {
    const headline = `${formatWindow(entry.window).padEnd(22)} ${pc.bold(`${entry.summary.completedGoals}/3 goals`)}`;
    const details = `Zone 2 ${entry.summary.zone2Count}  |  Zone 5 ${entry.summary.zone5Count}  |  Strength ${entry.summary.strengthCount}`;
    lines.push(headline);
    lines.push(pc.dim(details));
    lines.push(divider());
  }

  return lines.join('\n');
}

export function renderStrengthPlan(nextWorkout: WorkoutDefinition): string {
  const program = getProgram();
  const lines: string[] = [];

  lines.push(sectionTitle('Strength plan'));
  lines.push(pc.dim(`Rep target: ${program.repRange.min} -> ${program.repRange.max}, then add weight`));
  lines.push(divider());

  for (const workout of program.strengthCycle) {
    const isNext = workout.id === nextWorkout.id;
    const title = isNext
      ? `${pc.red('>')} ${pc.bold(workout.label)}  ${pc.dim('(next)')}`
      : `  ${pc.bold(workout.label)}`;

    lines.push(title);
    lines.push(pc.dim(`  ${workout.focus}`));

    for (const exercise of workout.exercises) {
      lines.push(`    - ${exercise.name}  ${pc.dim(`${exercise.startingWeight} kg start | +${exercise.increment} kg`)}`);
    }

    lines.push(divider());
  }

  return lines.join('\n');
}

export function renderWorkoutEditor(workout: WorkoutDefinition): string {
  const lines: string[] = [];

  lines.push(sectionTitle(`Edit ${workout.label}`));
  lines.push(pc.dim(workout.focus));
  lines.push(divider());

  for (const [index, exercise] of workout.exercises.entries()) {
    lines.push(
      `${String(index + 1).padStart(2, ' ')}. ${exercise.name}  ${pc.dim(`${exercise.startingWeight} kg start | +${exercise.increment} kg`)}`,
    );
  }

  return lines.join('\n');
}
