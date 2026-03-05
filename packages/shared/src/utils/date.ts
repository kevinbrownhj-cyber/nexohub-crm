export function parseDateTime(
  dateStr: string | null | undefined,
  timeStr?: string | null | undefined,
): Date | null {
  if (!dateStr) {
    return null;
  }

  try {
    let combinedStr = dateStr.trim();

    if (timeStr && timeStr.trim()) {
      combinedStr = `${dateStr.trim()} ${timeStr.trim()}`;
    }

    const date = new Date(combinedStr);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

export function formatDateTime(date: Date | string | null | undefined): string | null {
  if (!date) {
    return null;
  }

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString();
}

export function formatDateTimeLocal(date: Date | string | null | undefined): string | null {
  if (!date) {
    return null;
  }

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-PA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Panama',
  }).format(d);
}
