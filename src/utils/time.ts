export const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const getMinutesUntil = (value: string) => {
  const deltaMs = new Date(value).getTime() - Date.now();
  const minutes = Math.max(0, Math.round(deltaMs / 60_000));

  return minutes === 0 ? 'Due now' : `${minutes} min`;
};

export const formatRecentView = (value: string) => {
  const deltaMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60_000));

  if (minutes < 1) {
    return 'Viewed just now';
  }

  if (minutes < 60) {
    return `Viewed ${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `Viewed ${hours}h ago`;
  }

  return `Viewed ${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(value))}`;
};
