import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  text,
} from '@clack/prompts';
import { randomUUID } from 'node:crypto';
import pc from 'picocolors';
import {
  cloneProgram,
  createDefaultProgram,
  getDefaultWorkoutDefinition,
  getProgram,
  setProgram,
} from './data/program.ts';
import {
  createCompletedAt,
  createCurrentWindow,
  formatWindow,
  getDayKeyFromCompletedAt,
  getTodayDayKey,
  isValidDayKey,
} from './lib/dates.ts';
import { getStoragePath, loadLogbook, saveLogbook } from './lib/storage.ts';
import {
  renderArchiveList,
  renderDashboard,
  renderSessionList,
  renderStrengthPlan,
  renderStrengthSession,
  renderWorkoutEditor,
} from './lib/terminal.ts';
import {
  buildArchive,
  createStrengthDraft,
  createStrengthEditDraft,
  formatSessionDetails,
  formatSessionType,
  getNextWorkoutDefinition,
  getSessionsInWindow,
  getWorkoutDefinition,
  sortByCompletedAtDescending,
  summarizeWindow,
} from './lib/training.ts';
import type {
  ProgramDefinition,
  SessionRecord,
  WorkoutDefinition,
  StrengthExerciseDraft,
  StrengthSessionRecord,
  Zone2SessionRecord,
  Zone5SessionRecord,
} from './types.ts';

function unwrapPrompt<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }

  return value;
}

async function promptDayKey(defaultDayKey: string): Promise<string> {
  const useDefault = unwrapPrompt(await confirm({
    message: `Use ${defaultDayKey} as the session date?`,
    initialValue: true,
  }));

  if (useDefault) {
    return defaultDayKey;
  }

  return unwrapPrompt(await text({
    message: 'Enter date',
    placeholder: 'YYYY-MM-DD',
    defaultValue: defaultDayKey,
    validate(value) {
      if (typeof value !== 'string') {
        return 'Use YYYY-MM-DD.';
      }

      return isValidDayKey(value) ? undefined : 'Use YYYY-MM-DD.';
    },
  }));
}

async function promptRequiredText(message: string, initialValue: string): Promise<string> {
  return unwrapPrompt(await text({
    message,
    defaultValue: initialValue,
    placeholder: initialValue || 'Type here',
    validate(value) {
      if (typeof value !== 'string' || value.trim().length === 0) {
        return 'Enter a non-empty value.';
      }

      return undefined;
    },
  }));
}

async function promptWeight(message: string, initialValue: number): Promise<number> {
  const result = unwrapPrompt(await text({
    message,
    defaultValue: String(initialValue),
    placeholder: String(initialValue),
    validate(value) {
      if (typeof value !== 'string') {
        return 'Enter a valid non-negative number.';
      }

      const parsed = Number(value);

      if (!Number.isFinite(parsed) || parsed < 0) {
        return 'Enter a valid non-negative number.';
      }

      return undefined;
    },
  }));

  return Math.round(Number(result) * 10) / 10;
}

async function promptPositiveWeight(message: string, initialValue: number): Promise<number> {
  const result = unwrapPrompt(await text({
    message,
    defaultValue: String(initialValue),
    placeholder: String(initialValue),
    validate(value) {
      if (typeof value !== 'string') {
        return 'Enter a valid positive number.';
      }

      const parsed = Number(value);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        return 'Enter a valid positive number.';
      }

      return undefined;
    },
  }));

  return Math.round(Number(result) * 10) / 10;
}

async function pause(message = 'Back'): Promise<void> {
  unwrapPrompt(await select({
    message: 'Continue',
    options: [
      { label: message, value: 'back' },
    ],
  }));
}

function clearAndRender(output: string): void {
  console.clear();
  console.log(output);
  console.log('');
}

function sessionOptionLabel(session: SessionRecord): string {
  return `${getDayKeyFromCompletedAt(session.completedAt)}  ${formatSessionType(session.type)}  ${formatSessionDetails(session)}`;
}

function upsertSession(sessions: SessionRecord[], nextSession: SessionRecord): SessionRecord[] {
  const exists = sessions.some((session) => session.id === nextSession.id);
  return exists
    ? sessions.map((session) => (session.id === nextSession.id ? nextSession : session))
    : [...sessions, nextSession];
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'exercise';
}

function createExerciseId(name: string): string {
  return `${slugify(name)}-${randomUUID().slice(0, 8)}`;
}

async function persistState(sessions: SessionRecord[]): Promise<void> {
  await saveLogbook(sessions, getProgram());
}

async function saveProgramAndState(sessions: SessionRecord[], nextProgram: ProgramDefinition): Promise<void> {
  setProgram(nextProgram);
  await persistState(sessions);
}

async function chooseSession(sessions: SessionRecord[], message: string): Promise<SessionRecord | null> {
  const sortedSessions = sortByCompletedAtDescending(sessions);

  if (sortedSessions.length === 0) {
    clearAndRender(pc.dim('No sessions available.'));
    await pause();
    return null;
  }

  const choice = unwrapPrompt(await select({
    message,
    options: [
      ...sortedSessions.map((session) => ({
        label: sessionOptionLabel(session),
        value: session.id,
      })),
      { label: 'Back', value: 'back' },
    ],
  }));

  if (choice === 'back') {
    return null;
  }

  return sortedSessions.find((session) => session.id === choice) ?? null;
}

async function chooseWorkoutIndex(message: string): Promise<number | null> {
  const program = getProgram();
  const choice = unwrapPrompt(await select({
    message,
    options: [
      ...program.strengthCycle.map((workout, index) => ({
        label: `${workout.label}  ${workout.focus}`,
        value: String(index),
      })),
      { label: 'Back', value: 'back' },
    ],
  }));

  if (choice === 'back') {
    return null;
  }

  return Number(choice);
}

async function chooseExerciseIndex(workout: WorkoutDefinition, message: string): Promise<number | null> {
  const choice = unwrapPrompt(await select({
    message,
    options: [
      ...workout.exercises.map((exercise, index) => ({
        label: `${exercise.name}  ${exercise.startingWeight} kg start | +${exercise.increment} kg`,
        value: String(index),
      })),
      { label: 'Back', value: 'back' },
    ],
  }));

  if (choice === 'back') {
    return null;
  }

  return Number(choice);
}

async function logZone2(sessions: SessionRecord[]): Promise<{ sessions: SessionRecord[]; message: string }> {
  const program = getProgram();
  const dayKey = await promptDayKey(getTodayDayKey());
  const duration = unwrapPrompt(await select({
    message: 'Choose duration',
    initialValue: program.zone2Durations[1],
    options: program.zone2Durations.map((value) => ({
      label: `${value} min`,
      value,
    })),
  }));

  const nextSession: Zone2SessionRecord = {
    id: randomUUID(),
    type: 'zone2',
    completedAt: createCompletedAt(dayKey),
    payload: {
      durationMinutes: duration,
    },
  };

  const nextSessions = upsertSession(sessions, nextSession);
  await persistState(nextSessions);

  return {
    sessions: nextSessions,
    message: `Logged Zone 2 for ${dayKey}.`,
  };
}

async function logZone5(sessions: SessionRecord[]): Promise<{ sessions: SessionRecord[]; message: string }> {
  const program = getProgram();
  const dayKey = await promptDayKey(getTodayDayKey());
  const protocolId = unwrapPrompt(await select({
    message: 'Choose protocol',
    initialValue: program.zone5Protocols[0].id,
    options: program.zone5Protocols.map((protocol) => ({
      label: `${protocol.label}  ${protocol.description}`,
      value: protocol.id,
    })),
  }));

  const protocol = program.zone5Protocols.find((entry) => entry.id === protocolId) ?? program.zone5Protocols[0];
  const nextSession: Zone5SessionRecord = {
    id: randomUUID(),
    type: 'zone5',
    completedAt: createCompletedAt(dayKey),
    payload: {
      protocolId: protocol.id,
      protocolLabel: protocol.label,
    },
  };

  const nextSessions = upsertSession(sessions, nextSession);
  await persistState(nextSessions);

  return {
    sessions: nextSessions,
    message: `Logged ${protocol.label} for ${dayKey}.`,
  };
}

async function promptStrengthExercises(exercises: StrengthExerciseDraft[]): Promise<StrengthExerciseDraft[]> {
  const updated: StrengthExerciseDraft[] = [];

  for (const exercise of exercises) {
    clearAndRender([
      pc.bold(pc.red('STRENGTH ENTRY')),
      exercise.exerciseName,
      pc.dim(`Target: 2 sets x ${exercise.targetReps}`),
    ].join('\n'));

    const actualWeight = await promptWeight(`${exercise.exerciseName} working weight (kg)`, exercise.actualWeight);
    const completed = unwrapPrompt(await confirm({
      message: `Completed 2 sets x ${exercise.targetReps}?`,
      initialValue: exercise.completed,
    }));

    updated.push({
      ...exercise,
      actualWeight,
      completed,
    });
  }

  return updated;
}

async function logStrength(sessions: SessionRecord[]): Promise<{ sessions: SessionRecord[]; message: string }> {
  const workout = getNextWorkoutDefinition(sessions);
  const dayKey = await promptDayKey(getTodayDayKey());

  clearAndRender([
    pc.bold(pc.red('NEXT WORKOUT')),
    `${workout.label}  ${pc.dim(workout.focus)}`,
  ].join('\n'));

  const exercises = await promptStrengthExercises(createStrengthDraft(workout, sessions));
  const nextSession: StrengthSessionRecord = {
    id: randomUUID(),
    type: 'strength',
    completedAt: createCompletedAt(dayKey),
    payload: {
      workoutId: workout.id,
      workoutLabel: workout.label,
      exercises,
    },
  };

  const nextSessions = upsertSession(sessions, nextSession);
  await persistState(nextSessions);

  return {
    sessions: nextSessions,
    message: `Logged ${workout.label} for ${dayKey}.`,
  };
}

async function viewCurrentWeek(sessions: SessionRecord[]): Promise<void> {
  const currentWindow = createCurrentWindow();
  const currentSessions = sortByCompletedAtDescending(getSessionsInWindow(sessions, currentWindow));
  const summary = summarizeWindow(currentSessions);

  clearAndRender(renderSessionList('Current week', formatWindow(currentWindow), currentSessions, summary));

  const selected = await chooseSession(currentSessions, 'Inspect a session');
  if (!selected) {
    return;
  }

  if (selected.type === 'strength') {
    clearAndRender(renderStrengthSession(selected));
  } else {
    clearAndRender([
      pc.bold(pc.red(formatSessionType(selected.type))),
      getDayKeyFromCompletedAt(selected.completedAt),
      '',
      formatSessionDetails(selected),
    ].join('\n'));
  }

  await pause();
}

async function viewHistory(sessions: SessionRecord[]): Promise<void> {
  const archive = buildArchive(sessions, createCurrentWindow());
  clearAndRender(renderArchiveList(archive));

  if (archive.length === 0) {
    await pause();
    return;
  }

  const selectedWindow = unwrapPrompt(await select({
    message: 'Select a week',
    options: [
      ...archive.map((entry) => ({
        label: `${formatWindow(entry.window)}  ${entry.summary.completedGoals}/3 goals`,
        value: entry.window.startDay,
      })),
      { label: 'Back', value: 'back' },
    ],
  }));

  if (selectedWindow === 'back') {
    return;
  }

  const entry = archive.find((item) => item.window.startDay === selectedWindow);
  if (!entry) {
    return;
  }

  clearAndRender(renderSessionList('History detail', formatWindow(entry.window), entry.sessions, entry.summary));

  const selected = await chooseSession(entry.sessions, 'Inspect a session');
  if (!selected) {
    return;
  }

  if (selected.type === 'strength') {
    clearAndRender(renderStrengthSession(selected));
  } else {
    clearAndRender([
      pc.bold(pc.red(formatSessionType(selected.type))),
      getDayKeyFromCompletedAt(selected.completedAt),
      '',
      formatSessionDetails(selected),
    ].join('\n'));
  }

  await pause();
}

async function viewStrengthPlan(sessions: SessionRecord[]): Promise<void> {
  const nextWorkout = getNextWorkoutDefinition(sessions);
  clearAndRender(renderStrengthPlan(nextWorkout));
  await pause();
}

async function editExerciseInWorkout(
  sessions: SessionRecord[],
  workoutIndex: number,
  exerciseIndex: number,
): Promise<string | null> {
  let lastMessage: string | null = null;

  while (true) {
    const workout = getProgram().strengthCycle[workoutIndex];
    const exercise = workout.exercises[exerciseIndex];

    clearAndRender([
      renderWorkoutEditor(workout),
      '',
      pc.dim(`Editing ${exercise.name}`),
    ].join('\n'));

    const action = unwrapPrompt(await select({
      message: 'Choose an exercise action',
      options: [
        { label: 'Rename Exercise', value: 'rename' },
        { label: 'Edit Starting Weight', value: 'weight' },
        { label: 'Edit Increment', value: 'increment' },
        { label: 'Back', value: 'back' },
      ],
    }));

    if (action === 'back') {
      return lastMessage;
    }

    const nextProgram = cloneProgram(getProgram());
    const nextExercise = nextProgram.strengthCycle[workoutIndex].exercises[exerciseIndex];

    if (action === 'rename') {
      const name = await promptRequiredText('Exercise name', nextExercise.name);
      nextExercise.name = name.trim();
      await saveProgramAndState(sessions, nextProgram);
      lastMessage = `Updated ${nextExercise.name}.`;
      continue;
    }

    if (action === 'weight') {
      nextExercise.startingWeight = await promptWeight('Starting weight (kg)', nextExercise.startingWeight);
      await saveProgramAndState(sessions, nextProgram);
      lastMessage = `Updated start weight for ${nextExercise.name}.`;
      continue;
    }

    nextExercise.increment = await promptPositiveWeight('Increment (kg)', nextExercise.increment);
    await saveProgramAndState(sessions, nextProgram);
    lastMessage = `Updated increment for ${nextExercise.name}.`;
  }
}

async function editWorkout(sessions: SessionRecord[], workoutIndex: number): Promise<string | null> {
  let lastMessage: string | null = null;

  while (true) {
    const workout = getProgram().strengthCycle[workoutIndex];
    clearAndRender(renderWorkoutEditor(workout));

    const action = unwrapPrompt(await select({
      message: 'Choose a workout action',
      options: [
        { label: 'Rename Workout', value: 'rename' },
        { label: 'Edit Focus', value: 'focus' },
        { label: 'Edit Exercise', value: 'edit-exercise' },
        { label: 'Add Exercise', value: 'add-exercise' },
        { label: 'Remove Exercise', value: 'remove-exercise' },
        { label: 'Reset Workout To Default', value: 'reset-workout' },
        { label: 'Back', value: 'back' },
      ],
    }));

    if (action === 'back') {
      return lastMessage;
    }

    if (action === 'rename') {
      const nextProgram = cloneProgram(getProgram());
      nextProgram.strengthCycle[workoutIndex].label = (await promptRequiredText('Workout name', workout.label)).trim();
      await saveProgramAndState(sessions, nextProgram);
      lastMessage = `Renamed workout to ${nextProgram.strengthCycle[workoutIndex].label}.`;
      continue;
    }

    if (action === 'focus') {
      const nextProgram = cloneProgram(getProgram());
      nextProgram.strengthCycle[workoutIndex].focus = (await promptRequiredText('Workout focus', workout.focus)).trim();
      await saveProgramAndState(sessions, nextProgram);
      lastMessage = `Updated focus for ${nextProgram.strengthCycle[workoutIndex].label}.`;
      continue;
    }

    if (action === 'edit-exercise') {
      const exerciseIndex = await chooseExerciseIndex(workout, 'Choose an exercise');
      if (exerciseIndex === null) {
        continue;
      }

      const result = await editExerciseInWorkout(sessions, workoutIndex, exerciseIndex);
      if (result) {
        lastMessage = result;
      }
      continue;
    }

    if (action === 'add-exercise') {
      const name = (await promptRequiredText('Exercise name', '')).trim();
      const startingWeight = await promptWeight('Starting weight (kg)', 0);
      const increment = await promptPositiveWeight('Increment (kg)', 2.5);
      const nextProgram = cloneProgram(getProgram());

      nextProgram.strengthCycle[workoutIndex].exercises.push({
        id: createExerciseId(name),
        name,
        startingWeight,
        increment,
      });

      await saveProgramAndState(sessions, nextProgram);
      lastMessage = `Added ${name} to ${nextProgram.strengthCycle[workoutIndex].label}.`;
      continue;
    }

    if (action === 'remove-exercise') {
      if (workout.exercises.length <= 1) {
        clearAndRender(`${renderWorkoutEditor(workout)}\n\n${pc.dim('A workout must keep at least one exercise.')}`);
        await pause();
        continue;
      }

      const exerciseIndex = await chooseExerciseIndex(workout, 'Choose an exercise to remove');
      if (exerciseIndex === null) {
        continue;
      }

      const exercise = workout.exercises[exerciseIndex];
      const approved = unwrapPrompt(await confirm({
        message: `Remove ${exercise.name}?`,
        initialValue: false,
      }));

      if (!approved) {
        continue;
      }

      const nextProgram = cloneProgram(getProgram());
      nextProgram.strengthCycle[workoutIndex].exercises.splice(exerciseIndex, 1);
      await saveProgramAndState(sessions, nextProgram);
      lastMessage = `Removed ${exercise.name} from ${nextProgram.strengthCycle[workoutIndex].label}.`;
      continue;
    }

    const approved = unwrapPrompt(await confirm({
      message: `Reset ${workout.label} to its default template?`,
      initialValue: false,
    }));

    if (!approved) {
      continue;
    }

    const nextProgram = cloneProgram(getProgram());
    nextProgram.strengthCycle[workoutIndex] = getDefaultWorkoutDefinition(workout.id);
    await saveProgramAndState(sessions, nextProgram);
    lastMessage = `Reset ${nextProgram.strengthCycle[workoutIndex].label} to default.`;
  }
}

async function editStrengthPlan(sessions: SessionRecord[]): Promise<{ sessions: SessionRecord[]; message: string } | null> {
  let lastMessage: string | null = null;

  while (true) {
    const nextWorkout = getNextWorkoutDefinition(sessions);
    clearAndRender(renderStrengthPlan(nextWorkout));

    const action = unwrapPrompt(await select({
      message: 'Choose a plan action',
      options: [
        { label: 'Edit One Workout', value: 'edit-workout' },
        { label: 'Reset Full Strength Plan', value: 'reset-all' },
        { label: 'Back', value: 'back' },
      ],
    }));

    if (action === 'back') {
      return lastMessage ? { sessions, message: lastMessage } : null;
    }

    if (action === 'edit-workout') {
      const workoutIndex = await chooseWorkoutIndex('Choose a workout');
      if (workoutIndex === null) {
        continue;
      }

      const result = await editWorkout(sessions, workoutIndex);
      if (result) {
        lastMessage = result;
      }
      continue;
    }

    const approved = unwrapPrompt(await confirm({
      message: 'Reset the full strength plan to default?',
      initialValue: false,
    }));

    if (!approved) {
      continue;
    }

    await saveProgramAndState(sessions, createDefaultProgram());
    lastMessage = 'Reset the full strength plan to default.';
  }
}

async function editSession(sessions: SessionRecord[]): Promise<{ sessions: SessionRecord[]; message: string } | null> {
  const target = await chooseSession(sessions, 'Choose a session to edit');
  if (!target) {
    return null;
  }

  if (target.type === 'zone2') {
    const program = getProgram();
    const dayKey = await promptDayKey(getDayKeyFromCompletedAt(target.completedAt));
    const duration = unwrapPrompt(await select({
      message: 'Choose duration',
      initialValue: target.payload.durationMinutes,
      options: program.zone2Durations.map((value) => ({
        label: `${value} min`,
        value,
      })),
    }));

    const nextSession: Zone2SessionRecord = {
      ...target,
      completedAt: createCompletedAt(dayKey),
      payload: {
        durationMinutes: duration,
      },
    };

    const nextSessions = upsertSession(sessions, nextSession);
    await persistState(nextSessions);

    return {
      sessions: nextSessions,
      message: `Updated Zone 2 on ${dayKey}.`,
    };
  }

  if (target.type === 'zone5') {
    const program = getProgram();
    const dayKey = await promptDayKey(getDayKeyFromCompletedAt(target.completedAt));
    const protocolId = unwrapPrompt(await select({
      message: 'Choose protocol',
      initialValue: target.payload.protocolId,
      options: program.zone5Protocols.map((protocol) => ({
        label: `${protocol.label}  ${protocol.description}`,
        value: protocol.id,
      })),
    }));

    const protocol = program.zone5Protocols.find((entry) => entry.id === protocolId) ?? program.zone5Protocols[0];
    const nextSession: Zone5SessionRecord = {
      ...target,
      completedAt: createCompletedAt(dayKey),
      payload: {
        protocolId: protocol.id,
        protocolLabel: protocol.label,
      },
    };

    const nextSessions = upsertSession(sessions, nextSession);
    await persistState(nextSessions);

    return {
      sessions: nextSessions,
      message: `Updated Zone 5 on ${dayKey}.`,
    };
  }

  const dayKey = await promptDayKey(getDayKeyFromCompletedAt(target.completedAt));
  const workout = getWorkoutDefinition(target.payload.workoutId);
  const exercises = await promptStrengthExercises(createStrengthEditDraft(target));
  const nextSession: StrengthSessionRecord = {
    ...target,
    completedAt: createCompletedAt(dayKey),
    payload: {
      workoutId: workout.id,
      workoutLabel: workout.label,
      exercises,
    },
  };

  const nextSessions = upsertSession(sessions, nextSession);
  await persistState(nextSessions);

  return {
    sessions: nextSessions,
    message: `Updated ${workout.label} on ${dayKey}.`,
  };
}

async function deleteSession(sessions: SessionRecord[]): Promise<{ sessions: SessionRecord[]; message: string } | null> {
  const target = await chooseSession(sessions, 'Choose a session to delete');
  if (!target) {
    return null;
  }

  const approved = unwrapPrompt(await confirm({
    message: `Delete ${sessionOptionLabel(target)}?`,
    initialValue: false,
  }));

  if (!approved) {
    return {
      sessions,
      message: 'Delete cancelled.',
    };
  }

  const nextSessions = sessions.filter((session) => session.id !== target.id);
  await persistState(nextSessions);

  return {
    sessions: nextSessions,
    message: 'Session deleted.',
  };
}

async function main(): Promise<void> {
  intro('Longevity Log');

  const logbook = await loadLogbook();
  setProgram(logbook.program);

  let sessions = logbook.sessions;
  let flashMessage: string | null = null;

  while (true) {
    const currentWindow = createCurrentWindow();
    const currentSessions = sortByCompletedAtDescending(getSessionsInWindow(sessions, currentWindow));
    const summary = summarizeWindow(currentSessions);
    const nextWorkout = getNextWorkoutDefinition(sessions);

    clearAndRender(renderDashboard({
      currentWindow,
      summary,
      currentSessions,
      nextWorkout,
      storagePath: getStoragePath(),
      flashMessage,
    }));
    flashMessage = null;

    const action = unwrapPrompt(await select({
      message: 'Choose an action',
      options: [
        { label: 'Log Zone 2', value: 'log-zone2' },
        { label: 'Log Zone 5 / HIIT', value: 'log-zone5' },
        { label: 'Log Strength', value: 'log-strength' },
        { label: 'View Strength Plan', value: 'view-strength-plan' },
        { label: 'Edit Strength Plan', value: 'edit-strength-plan' },
        { label: 'View Current Week', value: 'view-current' },
        { label: 'View History', value: 'view-history' },
        { label: 'Edit Session', value: 'edit' },
        { label: 'Delete Session', value: 'delete' },
        { label: 'Exit', value: 'exit' },
      ],
    }));

    if (action === 'exit') {
      break;
    }

    if (action === 'log-zone2') {
      const result = await logZone2(sessions);
      sessions = result.sessions;
      flashMessage = result.message;
      continue;
    }

    if (action === 'log-zone5') {
      const result = await logZone5(sessions);
      sessions = result.sessions;
      flashMessage = result.message;
      continue;
    }

    if (action === 'log-strength') {
      const result = await logStrength(sessions);
      sessions = result.sessions;
      flashMessage = result.message;
      continue;
    }

    if (action === 'view-strength-plan') {
      await viewStrengthPlan(sessions);
      continue;
    }

    if (action === 'edit-strength-plan') {
      const result = await editStrengthPlan(sessions);
      if (result) {
        sessions = result.sessions;
        flashMessage = result.message;
      }
      continue;
    }

    if (action === 'view-current') {
      await viewCurrentWeek(sessions);
      continue;
    }

    if (action === 'view-history') {
      await viewHistory(sessions);
      continue;
    }

    if (action === 'edit') {
      const result = await editSession(sessions);
      if (result) {
        sessions = result.sessions;
        flashMessage = result.message;
      }
      continue;
    }

    if (action === 'delete') {
      const result = await deleteSession(sessions);
      if (result) {
        sessions = result.sessions;
        flashMessage = result.message;
      }
    }
  }

  outro('See you next session.');
}

main().catch((error) => {
  cancel(`Failed to start Longevity Log: ${(error as Error).message}`);
  process.exit(1);
});
