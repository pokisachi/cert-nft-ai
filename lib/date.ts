import dayjs from 'dayjs';

export const fmtDate = (d?: string | Date | null, withTime = false) => {
  if (!d) return '-';
  const m = dayjs(d);
  return withTime ? m.format('DD/MM/YYYY HH:mm') : m.format('DD/MM/YYYY');
};
