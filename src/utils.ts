export const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalISOString = (d: Date = new Date()) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, -1);
};

export const parseTaskInput = (input: string) => {
  const tags: string[] = [];
  const tagRegex = /\+([\w-]+)/g;
  const matches = input.match(tagRegex);
  
  if (matches) {
    matches.forEach(match => {
      tags.push(match.substring(1));
    });
  }
  
  const title = input.replace(tagRegex, '').trim();
  return { title, tags };
};

export const sanitizeData = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  });
  return sanitized;
};

export const getStreak = (activeDates: string[]) => {
  const dates = [...activeDates].sort();
  if (dates.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Check if streak is active (active today or yesterday)
  const lastActive = dates[dates.length - 1];
  if (lastActive !== today && lastActive !== yesterday) return 0;

  let streak = 1;
  let current = new Date(lastActive);
  
  for (let i = dates.length - 2; i >= 0; i--) {
    const prev = new Date(dates[i]);
    const diffTime = Math.abs(current.getTime() - prev.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      streak++;
      current = prev;
    } else {
      break;
    }
  }
  return streak;
};
