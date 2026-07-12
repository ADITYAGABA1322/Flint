export function formatFriendlyTime(ts: string | number | Date): string {
  let date: Date;
  if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === 'number') {
    date = ts < 10000000000 ? new Date(ts * 1000) : new Date(ts);
  } else {
    const num = Number(ts);
    if (!isNaN(num)) {
      date = num < 10000000000 ? new Date(num * 1000) : new Date(num);
    } else {
      date = new Date(ts);
    }
  }

  if (isNaN(date.getTime())) {
    return 'unknown time';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today ${timeString}`;
  }
  if (isYesterday) {
    return `Yesterday ${timeString}`;
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ` ${timeString}`;
}
