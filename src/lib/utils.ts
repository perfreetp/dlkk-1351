import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Alert } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serializeState(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return { __type: 'Date', value: obj.toISOString() };
  if (Array.isArray(obj)) return obj.map(serializeState);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeState(obj[key]);
    }
    return result;
  }
  return obj;
}

export function deserializeState(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj && obj.__type === 'Date') return new Date(obj.value);
  if (Array.isArray(obj)) return obj.map(deserializeState);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = deserializeState(obj[key]);
    }
    return result;
  }
  return obj;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getDateRangeBoundaries(preset: 'day' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (preset === 'day') {
    start = startOfDay(now);
    end = endOfDay(now);
  } else if (preset === 'week') {
    end = endOfDay(now);
    start = startOfDay(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6));
  } else if (preset === 'month') {
    end = endOfDay(now);
    start = startOfDay(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 29));
  } else {
    start = startDate ? startOfDay(new Date(startDate)) : startOfDay(now);
    end = endDate ? endOfDay(new Date(endDate)) : endOfDay(now);
    if (end < start) end = startOfDay(start);
  }
  return { start, end };
}

export function isInRange(d: Date, start: Date, end: Date): boolean {
  return d >= start && d <= end;
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function generateStatsForRange(days: number, realAlerts?: Alert[]) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - 1000 * 60 * 60 * 24 * (days - 1 - i));
    let level1 = 0;
    let level2 = 0;
    let level3 = 0;

    if (realAlerts && realAlerts.length > 0) {
      realAlerts.forEach((a) => {
        if (isSameDay(a.alertTime, date)) {
          if (a.level === 1) level1++;
          else if (a.level === 2) level2++;
          else level3++;
        }
      });
    } else {
      level1 = Math.floor(Math.random() * 5) + 1;
      level2 = Math.floor(Math.random() * 8) + 2;
      level3 = Math.floor(Math.random() * 6) + 1;
    }

    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count: level1 + level2 + level3,
      level1,
      level2,
      level3,
    };
  });
}

export function generateStatsFromTo(start: Date, end: Date, realAlerts?: Alert[]) {
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + 1000 * 60 * 60 * 24 * i);
    let level1 = 0;
    let level2 = 0;
    let level3 = 0;

    if (realAlerts && realAlerts.length > 0) {
      realAlerts.forEach((a) => {
        if (isSameDay(a.alertTime, date)) {
          if (a.level === 1) level1++;
          else if (a.level === 2) level2++;
          else level3++;
        }
      });
    }

    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count: level1 + level2 + level3,
      level1,
      level2,
      level3,
    };
  });
}
