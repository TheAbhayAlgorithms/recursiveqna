export function formatDate(val: any): string {
  if (!val) return 'Recently';

  let d: Date;
  if (typeof val === 'number') {
    d = new Date(val);
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) {
      d = new Date(Number(trimmed));
    } else {
      d = new Date(trimmed);
    }
  } else if (val instanceof Date) {
    d = val;
  } else {
    d = new Date(Number(val));
  }

  if (isNaN(d.getTime())) {
    return 'Recently';
  }

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
