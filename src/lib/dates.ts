import type { DayWindow } from '../types.ts';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isValidDayKey(dayKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return false;
  }

  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

export function getTodayDayKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(dayKey: string, amount: number): string {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + amount);
  return getTodayDayKey(date);
}

export function createCurrentWindow(todayDay = getTodayDayKey()): DayWindow {
  return {
    startDay: addDays(todayDay, -6),
    endDay: todayDay,
  };
}

export function createPreviousWindow(currentWindow: DayWindow, index: number): DayWindow {
  const endDay = addDays(currentWindow.startDay, -((index - 1) * 7 + 1));
  return {
    startDay: addDays(endDay, -6),
    endDay,
  };
}

export function createCompletedAt(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

export function getDayKeyFromCompletedAt(completedAt: string): string {
  return getTodayDayKey(new Date(completedAt));
}

export function isDayInWindow(dayKey: string, window: DayWindow): boolean {
  return dayKey >= window.startDay && dayKey <= window.endDay;
}

export function formatDayKey(dayKey: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
  }).format(parseDayKey(dayKey));
}

export function formatWindow(window: DayWindow): string {
  return `${formatDayKey(window.startDay)} - ${formatDayKey(window.endDay)}`;
}

export function formatSessionDate(completedAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseDayKey(getDayKeyFromCompletedAt(completedAt)));
}
