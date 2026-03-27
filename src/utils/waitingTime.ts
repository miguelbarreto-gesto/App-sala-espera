export type WaitingLevel = 'ok' | 'moderate' | 'long' | 'critical';

export function getWaitingLevel(checkedInAt: number | null): WaitingLevel {
  if (!checkedInAt) return 'ok';

  const minutes = (Date.now() - checkedInAt) / (1000 * 60);

  if (minutes >= 45) return 'critical';  // 45+ min - red
  if (minutes >= 30) return 'long';      // 30-44 min - orange
  if (minutes >= 15) return 'moderate';  // 15-29 min - yellow
  return 'ok';                           // 0-14 min - green
}

export function getWaitingMinutes(checkedInAt: number | null): number {
  if (!checkedInAt) return 0;
  return Math.floor((Date.now() - checkedInAt) / (1000 * 60));
}

export function getWaitingColor(level: WaitingLevel): string {
  switch (level) {
    case 'critical': return '#e53e3e';
    case 'long': return '#dd6b20';
    case 'moderate': return '#d69e2e';
    case 'ok': return '#38a169';
  }
}

export function getWaitingBgColor(level: WaitingLevel): string {
  switch (level) {
    case 'critical': return '#fff5f5';
    case 'long': return '#fffaf0';
    case 'moderate': return '#fffff0';
    case 'ok': return '#f0fff4';
  }
}

export function getWaitingBorderColor(level: WaitingLevel): string {
  switch (level) {
    case 'critical': return '#fc8181';
    case 'long': return '#fbd38d';
    case 'moderate': return '#fefcbf';
    case 'ok': return '#9ae6b4';
  }
}
